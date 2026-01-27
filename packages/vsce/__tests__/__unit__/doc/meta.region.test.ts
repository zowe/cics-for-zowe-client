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
import { RegionMeta } from "../../../src/doc";
import { IRegion } from "../../../src/doc/resources/IRegion";
import { Resource } from "../../../src/resources";
import { workspaceConfigurationGetMock } from "../../__mocks__";

workspaceConfigurationGetMock.mockReturnValueOnce([]).mockReturnValue(["MYREGION"]);

describe("Region Meta", () => {
  let regionMock: Resource<IRegion>;

  beforeEach(() => {
    regionMock = new Resource<IRegion>({
      eyu_cicsname: "MYREGION",
      cicsname: "MYREGION",
      cicsstatus: "ACTIVE",
      applid: "MYREGION",
      startup: "AUTOSTART",
      cicsstate: "ACTIVE",
      secbypass: "NO",
      wlmstatus: "NORMAL",
    });
  });

  it("should return label", () => {
    const label = RegionMeta.getLabel(regionMock);
    expect(label).toEqual(`MYREGION`);
  });

  it("Should default criteria", () => {
    const defaultCriteria = RegionMeta.getDefaultCriteria();
    expect(defaultCriteria).toEqual("");
  });

  it("should build criteria", () => {
    const criteria = RegionMeta.buildCriteria(["REGION1", "REGION2"]);
    expect(criteria).toEqual("APPLID=REGION1 OR APPLID=REGION2");
  });

  it("should return context", () => {
    const context = RegionMeta.getContext(regionMock);
    expect(context).toEqual(`CICSRegion.MYREGION`);
  });

  it("should get label", () => {
    const label = RegionMeta.getLabel(regionMock);
    expect(label).toEqual(`MYREGION`);
  });

  it("should return icon name", () => {
    const iconName = RegionMeta.getIconName(regionMock);
    expect(iconName).toEqual(`region`);
  });
  it("should get name", () => {
    const name = RegionMeta.getName(regionMock);
    expect(name).toEqual("MYREGION");
  });

  it("should return highlights", () => {
    const highlights = RegionMeta.getHighlights(regionMock);
    expect(highlights).toEqual([
      {
        key: "CICS Name",
        value: "MYREGION",
      },
      {
        key: "Application ID",
        value: "MYREGION",
      },
      {
        key: "Startup",
        value: "AUTOSTART",
      },
      {
        key: "CICS Status",
        value: "ACTIVE",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "MYREGION";
    await RegionMeta.appendCriteriaHistory(criteria);
    let history = RegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });

  it("should get criteria history", async () => {
    const criteria = "MYREGION";
    await RegionMeta.appendCriteriaHistory(criteria);
    let history = RegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });
});
