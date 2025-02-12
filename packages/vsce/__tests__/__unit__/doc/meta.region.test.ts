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
import { RegionMeta } from "../../../src/doc/RegionMeta";

describe("Region Meta", () => {

  let regionMock: IRegion;

  beforeEach(() => {
    regionMock = {
      applid: "MYREG",
      cicsname: "MYREG",
      cicsstate: "ACTIVE",
      cicsstatus: "ACTIVE",
      eyu_cicsname: "MYREG"
    };
  });

  it("should return label", () => {
    const label = RegionMeta.getLabel(regionMock);
    expect(label).toEqual(`MYREG`);
  });
  it("should return label with no applid from cicsname", () => {
    // @ts-ignore
    regionMock.applid = null;
    const label = RegionMeta.getLabel(regionMock);
    expect(label).toEqual(`MYREG`);
  });

  it("should return context", () => {
    const context = RegionMeta.getContext(regionMock);
    expect(context).toEqual(`cicsregion.myreg.active`);
  });
  it("should return context when cicsstate inactive", () => {
    regionMock.cicsstate = "INACTIVE";
    const context = RegionMeta.getContext(regionMock);
    expect(context).toEqual(`cicsregion.myreg.inactive`);
  });
  it("should return context when no cicsstate and cicsstatus inactive", () => {
    // @ts-ignore
    regionMock.cicsstate = null;
    regionMock.cicsstatus = "INACTIVE";
    const context = RegionMeta.getContext(regionMock);
    expect(context).toEqual(`cicsregion.myreg.inactive`);
  });

  it("should return icon name", () => {
    const iconName = RegionMeta.getIconName(regionMock);
    expect(iconName).toEqual(`region`);
  });
  it("should return icon name with disabled", () => {
    regionMock.cicsstate = "INACTIVE";
    const iconName = RegionMeta.getIconName(regionMock);
    expect(iconName).toEqual(`region-disabled`);
  });
});
