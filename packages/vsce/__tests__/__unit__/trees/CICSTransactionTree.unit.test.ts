/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

const getFolderIconMock = jest.fn();

import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import * as globalMocks from "../../__utils__/globalMocks";
import CustomError from "../../__utils__/CustomError";
import { CICSTransactionTree } from "../../../src/trees/CICSTransactionTree";
import { CICSTransactionTreeItem } from "../../../src/trees/treeItems/CICSTransactionTreeItem";
import * as filterUtils from "../../../src/utils/filterUtils";

jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/utils/iconUtils", () => {
  return { getFolderIcon: getFolderIconMock };
});
jest.mock("../../../src/trees/treeItems/CICSTransactionTreeItem");

const getResourceMock = globalMocks.getResourceMock;
const treeResourceMock = globalMocks.getDummyTreeResources("cicslocaltransaction", "fileName*");
const cicsTransactionTreeItemMock = {};
const record = [{ prop: "test1" }, { prop: "test2" }];
const toEscapedCriteriaString = globalMocks.toEscapedCriteriaString;
const getDefaultTransactionFilter = jest.spyOn(filterUtils, "getDefaultTransactionFilter");

describe("Test suite for CICSTaskTree", () => {
  let sut: CICSTransactionTree;

  beforeEach(() => {
    getFolderIconMock.mockReturnValue(treeResourceMock.iconPath);

    sut = new CICSTransactionTree(globalMocks.cicsRegionTreeMock as any as CICSRegionTree);
    expect(getFolderIconMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Test suite for addTransaction()", () => {
    it("Should add CICSTransactionTreeItem into transaction", () => {
      sut.addTransaction(cicsTransactionTreeItemMock as any as CICSTransactionTreeItem);
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Test suite for loadContents()", () => {
    beforeEach(() => {
      getResourceMock.mockResolvedValue(globalMocks.ICMCIApiResponseMock);
      getDefaultTransactionFilter.mockResolvedValueOnce("PROGRAM");
    });
    afterEach(() => {
      getResourceMock.mockClear();
      jest.resetAllMocks();
    });

    it("Should add newTransactionItem into the addTransaction() and activeFilter is undefined", async () => {
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;

      await sut.loadContents();

      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getFolderIconMock).toHaveBeenCalledWith(true);
      expect(sut.activeFilter).toBeUndefined();
      expect(sut.label).toBe("Transactions [2]");
    });

    it("Should add newTransactionItem into the addTransaction() and invoke toEscapedCriteriaString when activeFilter is defined", async () => {
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;
      sut.activeFilter = "Active";
      toEscapedCriteriaString.mockReturnValueOnce("PROGRAM");

      await sut.loadContents();
      expect(toEscapedCriteriaString).toHaveBeenCalled();
      expect(sut.activeFilter).toBeDefined();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getFolderIconMock).toHaveBeenCalledWith(true);
      expect(sut.label).toBe("Transactions (Active) [2]");
    });

    it("Should throw exception when error.mMessage includes {exceeded a resource limit}", async () => {
      getResourceMock.mockRejectedValue(new CustomError("Error in the method exceeded a resource limit"));
      await sut.loadContents();
      expect(getResourceMock).toHaveBeenCalled();
    });

    it("Should throw exception when error.mMessage include {exceeded a resource limit}", async () => {
      getResourceMock.mockRejectedValue(new CustomError("Error in the method"));

      await sut.loadContents();
      expect(getResourceMock).toHaveBeenCalled();
      expect(sut.label).toEqual("Transactions [0]");
    });
  });

  describe("Test suite for clearFilter", () => {
    it("Should clear active filter to undefined and set contextValue to unfiltered", () => {
      sut.activeFilter = "Active";

      sut.clearFilter();
      expect(sut.activeFilter).toBeUndefined();
      expect(sut.contextValue).toEqual("cicstreetransaction.unfiltered.transactions");
    });
  });

  describe("Test suite for setFilter", () => {
    it("Should set active filter and set contextValue to filtered", () => {
      sut.setFilter("ActiveFilter");

      expect(sut.activeFilter).toEqual("ActiveFilter");
      expect(sut.contextValue).toEqual("cicstreetransaction.filtered.transactions");
    });
  });

  describe("Test suite for getFilter", () => {
    it("Should return activeFilter object", () => {
      expect(sut.getFilter()).toBe(sut.activeFilter);
    });
  });
});
