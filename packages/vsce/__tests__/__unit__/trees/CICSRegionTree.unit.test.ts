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

const getIconByStatusMock = jest.fn();
const getIconFilePathFromNameMock = jest.fn();

import * as vscode from "vscode";

jest.mock("../../../src/trees/CICSResourceContainerNode");
jest.mock("../../../src/utils/iconUtils", () => {
  return {
    getIconByStatus: getIconByStatusMock,
    getIconFilePathFromName: getIconFilePathFromNameMock,
  };
});
jest.mock("@zowe/zowe-explorer-api", () => ({
  ...jest.requireActual("@zowe/zowe-explorer-api"),
  ZoweVsCodeExtension: { getZoweExplorerApi: jest.fn() },
}));
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: jest.fn(),
  },
}));

import { CICSTree } from "../../../src/trees";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import * as globalMocks from "../../__utils__/globalMocks";

const defaultFilterMock = jest.fn();
defaultFilterMock.mockReturnValue("DEFAULT FITLER");
const defaultResNumberMock = jest.fn();
defaultResNumberMock.mockReturnValue(10);

PersistentStorage.getDefaultResourceFilter = defaultFilterMock;
PersistentStorage.getNumberOfResourcesToFetch = defaultResNumberMock;

const region = {
  cicsname: "cics",
  cicsstate: "ACTIVE",
  applid: "APPLID",
};
const region_disable = {
  cicsname: "cics",
  cicsstate: "DISABLE",
};
const region_undefined = {
  cicsname: "cics",
};
const treeResourceMock = globalMocks.getDummyTreeResources("cicsregion", "");

const workspaceMock = globalMocks.workspaceMock;
const workspaceConfiguration = globalMocks.workspaceConfiguration;
const get = globalMocks.get;

describe("Test suite for CICSRegionTree", () => {
  let sut: CICSRegionTree;

  beforeEach(() => {
    getIconByStatusMock.mockReturnValue(treeResourceMock.iconPath);
    workspaceMock.mockReturnValue(workspaceConfiguration as any as vscode.WorkspaceConfiguration);
    get.mockReturnValue(true);

    const parent = new CICSSessionTree({ profile: globalMocks.CICSProfileMock }, {
      _onDidChangeTreeData: { fire: () => jest.fn() },
    } as unknown as CICSTree);
    sut = new CICSRegionTree("regionName", region, parent, undefined, parent);

    expect(getIconByStatusMock).toHaveBeenCalledWith("REGION", sut);
    expect(sut.isActive).toBeTruthy();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Should load region Tree when cicsstate is DISABLED", () => {
    const parent = new CICSSessionTree({ profile: globalMocks.CICSProfileMock }, {
      _onDidChangeTreeData: { fire: () => jest.fn() },
    } as unknown as CICSTree);
    sut = new CICSRegionTree("regionName", region_disable, parent, undefined, parent);

    expect(getIconByStatusMock).toHaveBeenCalledWith("REGION", sut);
    expect(sut.isActive).toBeFalsy();
  });

  it("Should load region Tree when cicsstate is ACTIVE", () => {
    const parent = new CICSSessionTree({ profile: globalMocks.CICSProfileMock }, {
      _onDidChangeTreeData: { fire: () => jest.fn() },
    } as unknown as CICSTree);
    sut = new CICSRegionTree("regionName", region_undefined, parent, undefined, parent);

    expect(getIconByStatusMock).toHaveBeenCalledWith("REGION", sut);
    expect(sut.isActive).toBeFalsy();
  });

  it("Should return true if applid or cicsname is defined", () => {
    expect(sut.getRegionName()).toBeTruthy();
  });

  it("Should return return all cics tree in children array", async () => {
    const result = await sut.getChildren();
    expect(result?.length).toBeGreaterThanOrEqual(6);
  });

  it("Should return parent", () => {
    expect(sut.getParent()).toBeDefined();
    expect(sut.getParent().profile).toEqual({
      profile: globalMocks.CICSProfileMock,
    });
  });

  it("Should return isActive", () => {
    expect(sut.getIsActive()).toBeTruthy();
  });
});
