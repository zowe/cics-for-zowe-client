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

import { ManagedRegionMeta } from "../../../src/doc/meta/managedRegion.meta";
import { IManagedRegion } from "@zowe/cics-for-zowe-explorer-api";
import { Resource } from "../../../src/resources";
import { workspaceConfigurationGetMock } from "../../__mocks__";

workspaceConfigurationGetMock.mockReturnValueOnce([]).mockReturnValue(["MYREGION"]);

describe("Region Meta", () => {
  let managedregionMock: Resource<IManagedRegion>;

  beforeEach(() => {
    managedregionMock = new Resource<IManagedRegion>({
      eyu_cicsname: "MYREGION",
      cicsname: "MYREGION",
      cicsstate: "ACTIVE",
      secbypass: "NO",
      wlmstatus: "NORMAL",
    });
  });

  it("should return label", () => {
    const label = ManagedRegionMeta.getLabel(managedregionMock);
    expect(label).toEqual(`MYREGION`);
  });

  it("Should default criteria", () => {
    const defaultCriteria = ManagedRegionMeta.getDefaultCriteria();
    expect(defaultCriteria).toEqual("");
  });

  it("should build criteria", () => {
    const criteria = ManagedRegionMeta.buildCriteria(["REGION1", "REGION2"]);
    expect(criteria).toEqual("CICSNAME=REGION1 OR CICSNAME=REGION2");
  });

  it("should return context", () => {
    const context = ManagedRegionMeta.getContext(managedregionMock);
    expect(context).toEqual(`CICSManagedRegion.MYREGION`);
  });

  it("should get label", () => {
    const label = ManagedRegionMeta.getLabel(managedregionMock);
    expect(label).toEqual(`MYREGION`);
  });

  it("should return icon name", () => {
    const iconName = ManagedRegionMeta.getIconName(managedregionMock);
    expect(iconName).toEqual(`region`);
  });
  it("should get name", () => {
    const name = ManagedRegionMeta.getName(managedregionMock);
    expect(name).toEqual("MYREGION");
  });

  it("should return highlights", () => {
    const highlights = ManagedRegionMeta.getHighlights(managedregionMock);
    expect(highlights).toEqual([
      {
        key: "CICS Name",
        value: "MYREGION",
      },
      {
        key: "CICS State",
        value: "ACTIVE",
      },
      {
        key: "Security Bypass",
        value: "NO",
      },
      {
        key: "WLM Status",
        value: "NORMAL",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "MYREGION";
    await ManagedRegionMeta.appendCriteriaHistory(criteria);
    let history = ManagedRegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });

  it("should get criteria history", async () => {
    const criteria = "MYREGION";
    await ManagedRegionMeta.appendCriteriaHistory(criteria);
    let history = ManagedRegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });
});
