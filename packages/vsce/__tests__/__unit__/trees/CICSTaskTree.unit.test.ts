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

import * as vscode from "vscode";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSTaskTree } from "../../../src/trees/CICSTaskTree";
import { CICSTaskTreeItem } from "../../../src/trees/treeItems/CICSTaskTreeItem";
import CustomError from "../../__utils__/CustomError";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/iconUtils", () => {
  return { getFolderIcon: getFolderIconMock };
});
jest.mock("../../../src/trees/treeItems/CICSTaskTreeItem", () => ({
  get CICSTaskTreeItem() {
    return jest.fn().mockImplementation(() => {
      return {
        setLabel: () => {
          this.label = "label";
        },
        label: "Label",
      };
    });
  },
}));

const getResourceMock = globalMocks.getResourceMock;
const treeResourceMock = globalMocks.getDummyTreeResources("cicstask", "fileName*");
const cicsTaskTreeItemMock = {};
const workspaceMock = globalMocks.workspaceMock;
const get = globalMocks.get;
const workspaceConfiguration = globalMocks.workspaceConfiguration;

const record = [{ prop: "test1" }, { prop: "test2" }];
const toEscapedCriteriaString = globalMocks.toEscapedCriteriaString;

describe("Test suite for CICSTaskTree", () => {
  let sut: CICSTaskTree;

  beforeEach(() => {
    getFolderIconMock.mockReturnValue(treeResourceMock.iconPath);

    sut = new CICSTaskTree(globalMocks.cicsRegionTreeMock as any as CICSRegionTree);
    expect(getFolderIconMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Test suite for addLibrary()", () => {
    it("Should add CICSProgramTreeItem into library", () => {
      sut.addTask(cicsTaskTreeItemMock as any as CICSTaskTreeItem);
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Test suite for loadContents()", () => {
    beforeEach(() => {
      getResourceMock.mockResolvedValue(globalMocks.ICMCIApiResponseMock);
      workspaceMock.mockReturnValue(workspaceConfiguration as any as vscode.WorkspaceConfiguration);
      get.mockReturnValue(treeResourceMock.defaultCriteria);
    });
    afterEach(() => {
      getResourceMock.mockClear();
      jest.resetAllMocks();
    });

    it("Should add newCICSTaskTreeItem into the addTask() and activeTransactionFilter is undefined", async () => {
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;

      await sut.loadContents();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getFolderIconMock).toHaveBeenCalledWith(true);
      expect(sut.activeTransactionFilter).toBeUndefined();
      expect(workspaceMock).toHaveBeenCalledTimes(1);
      expect(sut.label).toBe("Tasks [2]");
    });

    it("Should add newProgramItem into the addProgram() and invoke toEscapedCriteriaString when activeTransactionFilter is defined", async () => {
      sut.activeTransactionFilter = "Active";
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;
      toEscapedCriteriaString.mockReturnValueOnce("PROGRAM");
      get.mockReturnValue([]);

      await sut.loadContents();
      expect(toEscapedCriteriaString).toHaveBeenCalled();
      expect(sut.activeTransactionFilter).toBeDefined();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getFolderIconMock).toHaveBeenCalledWith(true);
      expect(workspaceMock).toHaveBeenCalledTimes(2);
      expect(sut.label).toBe("Tasks (Active) [2]");
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
      expect(sut.label).toEqual("Tasks [0]");
    });
  });

  describe("Test suite for clearFilter", () => {
    it("Should clear active filter to undefined and set contextValue to unfiltered", () => {
      sut.activeTransactionFilter = "Active";

      sut.clearFilter();
      expect(sut.activeTransactionFilter).toBeUndefined();
      expect(sut.contextValue).toEqual("cicstreetask.unfiltered.tasks");
    });
  });

  describe("Test suite for setFilter", () => {
    it("Should set active filter and set contextValue to filtered", () => {
      sut.setFilter("ActiveFilter");
      expect(sut.activeTransactionFilter).toEqual("ActiveFilter");
      expect(sut.contextValue).toEqual("cicstreetask.filtered.tasks");
    });
  });

  describe("Test suite for getFilter", () => {
    it("Should return activeFilter object", () => {
      expect(sut.getFilter()).toBe(sut.activeTransactionFilter);
    });
  });
});
