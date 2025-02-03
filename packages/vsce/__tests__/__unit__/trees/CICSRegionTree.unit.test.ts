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

import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("../../../src/trees/CICSProgramTree");
jest.mock("../../../src/trees/CICSTransactionTree");
jest.mock("../../../src/trees/CICSLocalFileTree");
jest.mock("../../../src/trees/CICSTaskTree");
jest.mock("../../../src/trees/CICSLibraryTree");
jest.mock("../../../src/trees/CICSWebTree");

jest.mock("../../../src/utils/iconUtils", () => {
  return { getIconByStatus: getIconByStatusMock };
});

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

describe("Test suite for CICSRegionTree", () => {
  let sut: CICSRegionTree;

  beforeEach(() => {
    getIconByStatusMock.mockReturnValue(treeResourceMock.iconPath);
    sut = new CICSRegionTree(
      "regionName",
      region,
      globalMocks.CICSSessionTreeMock as any as CICSSessionTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
      "Parent",
    );

    expect(getIconByStatusMock).toHaveBeenCalledWith("REGION", sut);
    expect(sut.isActive).toBeTruthy();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Should load region Tree when cicsstate is DISABLED", () => {
    sut = new CICSRegionTree(
      "regionName",
      region_disable,
      globalMocks.CICSSessionTreeMock as any as CICSSessionTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
      region,
    );

    expect(getIconByStatusMock).toHaveBeenCalledWith("REGION", sut);
    expect(sut.isActive).toBeFalsy();
  });

  it("Should load region Tree when cicsstate is ACTIVE", () => {
    sut = new CICSRegionTree(
      "regionName",
      region_undefined,
      globalMocks.CICSSessionTreeMock as any as CICSSessionTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
      region,
    );

    expect(getIconByStatusMock).toHaveBeenCalledWith("REGION", sut);
    expect(sut.isActive).toBeFalsy();
  });

  it("Should return true if applid or cicsname is defined", () => {
    expect(sut.getRegionName()).toBeTruthy();
  });

  it("Should return return all cics tree in children array", () => {
    const result = sut.getChildren();
    expect(result?.length).toBeGreaterThanOrEqual(6);
  });

  it("Should return parent", () => {
    expect(sut.getParent()).toBe("Parent");
  });

  it("Should return isActive", () => {
    expect(sut.getIsActive()).toBeTruthy();
  });
});
