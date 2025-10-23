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

import { IBundlePart, IBundle } from "@zowe/cics-for-zowe-explorer-api";
import { BundlePartMeta } from "../../../src/doc/meta/bundlePart.meta";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("Bundle Part Meta", () => {
  let bundlePartMock: Resource<IBundlePart>;
  let parentResource: Resource<IBundle>;

  beforeEach(() => {
    parentResource = new Resource<IBundle>({
      name: "BUND1",
      bundledir: "/my/path",
      bundleid: "BUNDID1",
      enablestatus: "ENABLED",
      eyu_cicsname: "REG",
      partcount: "2",
    });
    bundlePartMock = new Resource({
      bundle: "BUND1",
      bundlepart: "PART2",
      enablestatus: "ENABLED",
      eyu_cicsname: "REG1",
      partclass: "CLS",
      status: "ENABLED",
    });
  });

  it("should build criteria", () => {
    const label = BundlePartMeta.buildCriteria(["A", "B"], parentResource.attributes);
    expect(label).toEqual(`(BUNDLEPART='A' OR BUNDLEPART='B') AND (BUNDLE='BUND1')`);
  });

  it("should return default criteria", async () => {
    const label = await BundlePartMeta.getDefaultCriteria(parentResource.attributes);
    expect(label).toEqual(`BUNDLE='BUND1'`);
  });

  it("should return label", () => {
    const label = BundlePartMeta.getLabel(bundlePartMock);
    expect(label).toEqual(`PART2`);
  });
  it("should return label when disabled", () => {
    bundlePartMock.attributes.enablestatus = "disabled";
    const label = BundlePartMeta.getLabel(bundlePartMock);
    expect(label).toEqual(`PART2 (Disabled)`);
  });

  it("should return context", () => {
    const context = BundlePartMeta.getContext(bundlePartMock);
    expect(context).toEqual(`CICSBundlePart.ENABLED.PART2`);
  });
  it("should return context when disabled", () => {
    bundlePartMock.attributes.enablestatus = "disabled";
    const context = BundlePartMeta.getContext(bundlePartMock);
    expect(context).toEqual(`CICSBundlePart.DISABLED.PART2`);
  });

  it("should return icon name", () => {
    const iconName = BundlePartMeta.getIconName(bundlePartMock);
    expect(iconName).toEqual(`bundle-part`);
  });
  it("should return icon name when disabled", () => {
    bundlePartMock.attributes.enablestatus = "disabled";
    const iconName = BundlePartMeta.getIconName(bundlePartMock);
    expect(iconName).toEqual(`bundle-part-disabled`);
  });

  it("should return name", () => {
    const iconName = BundlePartMeta.getName(bundlePartMock);
    expect(iconName).toEqual(`PART2`);
  });

  it("should return highlights", () => {
    const highlights = BundlePartMeta.getHighlights(bundlePartMock);
    expect(highlights).toEqual([
      {
        key: "Bundle",
        value: "BUND1",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "BUND1";
    await BundlePartMeta.appendCriteriaHistory(criteria);
    let history = BundlePartMeta.getCriteriaHistory();
    expect(history).toEqual(["BUND1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "BUND1";
    await BundlePartMeta.appendCriteriaHistory(criteria);
    let history = BundlePartMeta.getCriteriaHistory();
    expect(history).toEqual(["BUND1"]);
  });
});
