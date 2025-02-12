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

import { IRegion } from "@zowe/cics-for-zowe-sdk";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("../../../src/trees/CICSResourceTree");

const region: IRegion = {
  cicsname: "cics",
  cicsstate: "ACTIVE",
  applid: "APPLID",
  cicsstatus: "ACTIVE",
  eyu_cicsname: "APPLID"
};
const region_disable: IRegion = {
  cicsname: "cics",
  cicsstate: "INACTIVE",
  applid: "applid",
  cicsstatus: "INACTIVE",
  eyu_cicsname: "applid"
};
const region_undefined: IRegion = {
  cicsname: "cics",
  cicsstate: "INACTIVE",
  applid: "applid",
  cicsstatus: "INACTIVE",
  eyu_cicsname: "applid"
};

describe("Test suite for CICSRegionTree", () => {
  let sut: CICSRegionTree;

  beforeEach(() => {
    sut = new CICSRegionTree(
      region,
      globalMocks.CICSSessionTreeMock as any as CICSSessionTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
    );

    expect(sut.iconPath).toHaveProperty("light");
    expect(sut.iconPath).toHaveProperty("dark");
    // @ts-ignore
    expect(sut.iconPath?.light).toContain("region-dark.svg");
    // @ts-ignore
    expect(sut.iconPath?.dark).toContain("region-light.svg");
    expect(sut.isActive).toBeTruthy();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Should load region Tree when cicsstate is INACTIVE", () => {
    sut = new CICSRegionTree(
      region_disable,
      globalMocks.CICSSessionTreeMock as any as CICSSessionTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
    );

    expect(sut.iconPath).toHaveProperty("light");
    expect(sut.iconPath).toHaveProperty("dark");
    // @ts-ignore
    expect(sut.iconPath?.light).toContain("region-disabled-dark.svg");
    // @ts-ignore
    expect(sut.iconPath?.dark).toContain("region-disabled-light.svg");
    expect(sut.isActive).toBeFalsy();
  });

  it("Should load region Tree when cicsstate is ACTIVE", () => {
    sut = new CICSRegionTree(
      region_undefined,
      globalMocks.CICSSessionTreeMock as any as CICSSessionTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
      globalMocks.CICSPlexTree as any as CICSPlexTree,
    );

    expect(sut.iconPath).toHaveProperty("light");
    expect(sut.iconPath).toHaveProperty("dark");
    // @ts-ignore
    expect(sut.iconPath?.light).toContain("region-disabled-dark.svg");
    // @ts-ignore
    expect(sut.iconPath?.dark).toContain("region-disabled-light.svg");
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
    expect(sut.getParent()).toBe(globalMocks.CICSPlexTree);
  });

  it("Should return isActive", () => {
    expect(sut.getIsActive()).toBeTruthy();
  });
});
