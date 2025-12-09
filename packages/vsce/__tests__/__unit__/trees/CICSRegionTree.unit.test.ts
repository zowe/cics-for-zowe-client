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

import { CICSTree } from "../../../src/trees";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import * as iconUtils from "../../../src/utils/iconUtils";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { profile } from "../../__mocks__";

jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);

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

const getIconByStatusSpy = jest.spyOn(iconUtils, "getIconByStatus");

describe("Test suite for CICSRegionTree", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;
  let regionTree: CICSRegionTree;

  beforeEach(() => {
    cicsTree = new CICSTree();
    sessionTree = new CICSSessionTree(profile, cicsTree);
    regionTree = new CICSRegionTree("regionName", region, sessionTree, undefined, sessionTree);

    expect(regionTree.isActive).toBeTruthy();
  });

  it("Should load region Tree when cicsstate is DISABLED", () => {
    regionTree = new CICSRegionTree("regionName", region_disable, sessionTree, undefined, sessionTree);

    expect(getIconByStatusSpy).toHaveBeenCalledWith("REGION", regionTree);
    expect(regionTree.isActive).toBeFalsy();
  });

  it("Should load region Tree when cicsstate is ACTIVE", () => {
    regionTree = new CICSRegionTree("regionName", region_undefined, sessionTree, undefined, sessionTree);

    expect(getIconByStatusSpy).toHaveBeenCalledWith("REGION", regionTree);
    expect(regionTree.isActive).toBeFalsy();
  });

  it("Should return true if applid or cicsname is defined", () => {
    expect(regionTree.getRegionName()).toBeTruthy();
  });

  it("Should return return all cics tree in children array", async () => {
    const result = await regionTree.getChildren();
    expect(result?.length).toBeGreaterThanOrEqual(6);
  });

  it("Should return parent", () => {
    expect(regionTree.getParent()).toBeDefined();
    expect(regionTree.getParent().profile).toBeDefined();
    expect(regionTree.getParent().profile).toHaveProperty("profile");
  });

  it("Should return isActive", () => {
    expect(regionTree.getIsActive()).toBeTruthy();
  });

  it("Children should be sorted when built", async () => {
    const result = await regionTree.getChildren();
    expect(result).toHaveLength(10);

    const actual = result.map((c) => `${c.label}`);
    const expected = result.map((c) => `${c.label}`).sort((a, b) => a.localeCompare(b));

    expect(actual).toEqual(expected);
  });
});
