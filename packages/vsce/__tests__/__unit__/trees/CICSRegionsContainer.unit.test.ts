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
const getRegionInfoInPlexMock = jest.fn();

import * as vscode from "vscode";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import { CICSTree } from "../../../src/trees/CICSTree";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/utils/iconUtils", () => {
  return { getFolderIcon: getFolderIconMock };
});
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getRegionInfoInPlex: getRegionInfoInPlexMock,
  },
}));
jest.mock("../../../src/trees/CICSRegionTree");
jest.mock("../../../src/utils/CICSLogger");

const getResourceMock = globalMocks.getResourceMock;
const treeResourceMock = globalMocks.getDummyTreeResources("cicsmanagedregion", "fileName*");
const CICSTreeMock = {
  _onDidChangeTreeData: {
    fire: () => jest.fn(),
  },
};
const windowProgressMock = jest.spyOn(vscode.window, "withProgress");
const record = [
  { cicsname: "cics", cicsstate: "ACTIVE" },
  { cicsname: "test2", cicsstate: "ACTIVE" },
];

describe("Test suite for CICSRegionsContainer", () => {
  let sut: CICSRegionsContainer;

  beforeEach(() => {
    getFolderIconMock.mockReturnValue(treeResourceMock.iconPath);
    windowProgressMock.mockResolvedValueOnce(true);

    sut = new CICSRegionsContainer(globalMocks.CICSPlexTree as any as CICSPlexTree);
    expect(getFolderIconMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Test suite for filterRegions", () => {
    it("should filter regions based on the pattern", () => {
      sut.filterRegions("IYC*", CICSTreeMock as any as CICSTree);

      expect(sut.activeFilter).toBe("IYC*");
      expect(windowProgressMock).toHaveBeenCalled();
    });
  });

  describe("Test suite for loadRegionsInCICSGroup", () => {
    beforeEach(() => {
      getResourceMock.mockResolvedValue(globalMocks.ICMCIApiResponseMock);
    });
    afterEach(() => {
      getResourceMock.mockClear();
      jest.resetAllMocks();
    });

    it("should load regions in CICS group", async () => {
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;
      sut.activeFilter = "cics";

      await sut.loadRegionsInCICSGroup(CICSTreeMock as any as CICSTree);

      /*expect(getResourceMock).toHaveBeenCalledWith(sut.getParent().getParent().getSession(), testData, {
        failOnNoData: false,
        useCICSCmciRestError: true,
      });*/
      expect(sut.label).toBe("Regions (cics) [1/1]");
      expect(sut.collapsibleState).toBe(2);
    });
  });

  describe("Test suite for loadRegionsInPlex", () => {
    beforeEach(() => {
      getRegionInfoInPlexMock.mockResolvedValueOnce(record);
    });
    afterEach(() => {
      getRegionInfoInPlexMock.mockClear();
    });

    it("Should load all regions of plex", async () => {
      await sut.loadRegionsInPlex();

      expect(getRegionInfoInPlexMock).toHaveBeenCalledTimes(1);
      expect(sut.label).toBe("Regions [2/2]");
      expect(sut.collapsibleState).toBe(2);
    });
  });
});
