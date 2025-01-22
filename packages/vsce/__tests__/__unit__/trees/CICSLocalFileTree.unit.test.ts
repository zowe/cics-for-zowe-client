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

const getIconOpenMock = jest.fn();

import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSLocalFileTreeItem } from "../../../src/trees/treeItems/CICSLocalFileTreeItem";

import { CICSLocalFileTree } from "../../../src/trees/CICSLocalFileTree";
import CustomError from "../../__utils__/CustomError";
import * as vscode from "vscode";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/trees/treeItems/CICSLocalFileTreeItem");
jest.mock("../../../src/utils/profileUtils", () => {
  return { getIconOpen: getIconOpenMock };
});



const getResourceMock = globalMocks.getResourceMock;
const toEscapedCriteriaString = globalMocks.toEscapedCriteriaString;
const CICSLocalFileTreeItemMock = {};
const treeResourceMock = globalMocks.getDummyTreeResources("testResource", "fileName*", "cicslocalfile");
const record = [{ prop: "test1" }, { prop: "test2" }];

const workspaceMock = jest.spyOn(vscode.workspace, "getConfiguration");
const get = jest.fn();
const workspaceConfiguration = {
  get: get,
  update: jest.fn(),
};

describe("Test suite for CICSLocalFileTree", () => {
  let sut: CICSLocalFileTree;

  beforeEach(() => {
    getIconOpenMock.mockReturnValue(treeResourceMock.iconPath);
    sut = new CICSLocalFileTree(globalMocks.cicsRegionTreeMock as any as CICSRegionTree);
    expect(getIconOpenMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Test suite for addProgram()", () => {
    it("Should add CICSLocalFileTreeItem into localFile", () => {
      sut.addLocalFile(CICSLocalFileTreeItemMock as any as CICSLocalFileTreeItem);
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Test suite for loadContents()", () => {
    beforeEach(() => {
      getResourceMock.mockImplementation(async () => globalMocks.ICMCIApiResponseMock);
      workspaceMock.mockReturnValue(workspaceConfiguration as any as vscode.WorkspaceConfiguration);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it("Should add newProgramItem into the addProgram() and activeFilter is undefined", async () => {
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;
      get.mockReturnValue(treeResourceMock.defaultCriteria);

      await sut.loadContents();
      expect(workspaceMock).toHaveBeenCalled();
      expect(sut.activeFilter).toBeUndefined();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getIconOpenMock).toHaveBeenCalledWith(true);
    });

    it("Should add newProgramItem into the addProgram() and invoke toEscapedCriteriaString when activeFilter is defined", async () => {
      sut.activeFilter = "Active";
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.responseRecords.toLowerCase()] = record;
      toEscapedCriteriaString.mockReturnValueOnce("PROGRAM");
      get.mockReturnValue([]);

      await sut.loadContents();
      expect(toEscapedCriteriaString).toHaveBeenCalled();
      expect(sut.activeFilter).toBeDefined();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
      expect(getIconOpenMock).toHaveBeenCalledWith(true);
      expect(workspaceMock).toHaveBeenCalledTimes(2);
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
      expect(sut.label).toEqual("Local Files [0]");
    });
  });

  describe("Test suite for clearFilter", () => {
    it("Should clear active filter to undefined and set contextValue to unfiltered", () => {
      sut.activeFilter = "Active";

      sut.clearFilter();
      expect(sut.activeFilter).toBeUndefined();
      expect(sut.contextValue).toEqual("cicstreelocalfile.unfiltered.localFiles");
    });
  });

  describe("Test suite for setFilter", () => {
    it("Should set active filter and set contextValue to filtered", () => {
      sut.setFilter("ActiveFilter");
      expect(sut.activeFilter).toEqual("ActiveFilter");
      expect(sut.contextValue).toEqual("cicstreelocalfile.filtered.localFiles");
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
