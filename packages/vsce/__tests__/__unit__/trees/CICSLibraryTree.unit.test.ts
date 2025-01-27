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
import CustomError from "../../__utils__/CustomError";
import { CICSLibraryTree } from "../../../src/trees/CICSLibraryTree";
import { CICSLibraryTreeItem } from "../../../src/trees/treeItems/CICSLibraryTreeItem";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/trees/treeItems/CICSLibraryTreeItem");
jest.mock("../../../src/utils/iconUtils", () => {
  return { getFolderIcon: getFolderIconMock };
});

const getResourceMock = globalMocks.getResourceMock;
const toEscapedCriteriaString = globalMocks.toEscapedCriteriaString;
const CICSLibraryTreeItemMock = {};
const treeResourceMock = globalMocks.getDummyTreeResources("testResource", "fileName*", "cicsprogram");
const record = [{ prop: "test1" }, { prop: "test2" }];

describe("Test suite for CICSLibraryTree", () => {
  let sut: CICSLibraryTree;

  beforeEach(() => {
    getFolderIconMock.mockReturnValue(treeResourceMock.iconPath);
    sut = new CICSLibraryTree(globalMocks.cicsRegionTreeMock as any as CICSRegionTree);
    expect(getFolderIconMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Test suite for addLibrary()", () => {
    it("Should add CICSProgramTreeItem into library", () => {
      sut.addLibrary(CICSLibraryTreeItemMock as any as CICSLibraryTreeItem);
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Test suite for loadContents()", () => {
    beforeEach(() => {
      getResourceMock.mockImplementation(async () => globalMocks.ICMCIApiResponseMock);
    });
    afterEach(() => {
      getResourceMock.mockClear();
      jest.resetAllMocks();
    });

    it("Should add newLibraryItem into the addLibrary() and activeFilter is undefined", async () => {
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;

      await sut.loadContents();
      expect(sut.activeFilter).toBeUndefined();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getFolderIconMock).toHaveBeenCalledWith(true);
    });

    it("Should add newLibraryItem into the addLibrary() and invoke toEscapedCriteriaString when activeFilter is defined", async () => {
      sut.activeFilter = "Active";
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.responseRecords.toLowerCase()] = record;
      toEscapedCriteriaString.mockReturnValueOnce("LIBRARY");

      await sut.loadContents();
      expect(toEscapedCriteriaString).toHaveBeenCalled();
      expect(sut.activeFilter).toBeDefined();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getFolderIconMock).toHaveBeenCalledWith(true);
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
      expect(sut.label).toEqual("Libraries [0]");
    });
  });

  describe("Test suite for clearFilter", () => {
    it("Should clear active filter to undefined and set contextValue to unfiltered", () => {
      sut.activeFilter = "Active";

      sut.clearFilter();
      expect(sut.activeFilter).toBeUndefined();
      expect(sut.contextValue).toEqual("cicstreelibrary.unfiltered.libraries");
    });
  });

  describe("Test suite for setFilter", () => {
    it("Should set active filter and set contextValue to filtered", () => {
      sut.setFilter("ActiveFilter");
      expect(sut.activeFilter).toEqual("ActiveFilter");
      expect(sut.contextValue).toEqual("cicstreelibrary.filtered.libraries");
    });
  });

  describe("Test suite for getFilter", () => {
    it("Should return activeFilter object", () => {
      expect(sut.getFilter()).toBe(sut.activeFilter);
    });
  });

  describe("Test suite for getParent", () => {
    it("Should return parentRegion object", () => {
      expect(sut.getParent()).toBe(sut.parentRegion);
    });
  });
});
