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

import { BundleMeta } from "../../../src/doc/meta/bundle.meta";
import { IBundle } from "../../../src/doc/resources/IBundle";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("Bundle Meta", () => {
  let bundleMock: Resource<IBundle>;

  beforeEach(() => {
    bundleMock = new Resource({
      name: "BUND1",
      bundledir: "/my/user/path",
      bundleid: "BUNDID1",
      enablestatus: "ENABLED",
      eyu_cicsname: "MYREG",
      partcount: "2",
      status: "ENABLED",
    });
  });

  it("should return criteria", () => {
    const criteria = BundleMeta.buildCriteria(["A", "B"]);
    expect(criteria).toEqual(`name=A OR name=B`);
  });
  it("should get default criteria", async () => {
    const criteria = await BundleMeta.getDefaultCriteria();
    expect(criteria).toEqual(`name=*`);
  });

  it("should return label", () => {
    const label = BundleMeta.getLabel(bundleMock);
    expect(label).toEqual(`BUND1`);
  });
  it("should return label when disabled", () => {
    bundleMock.attributes.enablestatus = "disabled";
    const label = BundleMeta.getLabel(bundleMock);
    expect(label).toEqual(`BUND1 (Disabled)`);
  });

  it("should return context", () => {
    const context = BundleMeta.getContext(bundleMock);
    expect(context).toEqual(`CICSBundle.ENABLED.BUND1`);
  });
  it("should return context when disabled", () => {
    bundleMock.attributes.enablestatus = "disabled";
    const context = BundleMeta.getContext(bundleMock);
    expect(context).toEqual(`CICSBundle.DISABLED.BUND1`);
  });

  it("should return icon name", () => {
    const iconName = BundleMeta.getIconName(bundleMock);
    expect(iconName).toEqual(`bundle`);
  });
  it("should return icon name when disabled", () => {
    bundleMock.attributes.enablestatus = "disabled";
    const iconName = BundleMeta.getIconName(bundleMock);
    expect(iconName).toEqual(`bundle-disabled`);
  });

  it("should return name", () => {
    const iconName = BundleMeta.getName(bundleMock);
    expect(iconName).toEqual(`BUND1`);
  });

  it("should return highlights", () => {
    const highlights = BundleMeta.getHighlights(bundleMock);
    expect(highlights).toEqual([
      {
        key: "Bundle Directory",
        value: bundleMock.attributes.bundledir,
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "BUND1";
    await BundleMeta.appendCriteriaHistory(criteria);
    let history = BundleMeta.getCriteriaHistory();
    expect(history).toEqual(["BUND1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "BUND1";
    await BundleMeta.appendCriteriaHistory(criteria);
    let history = BundleMeta.getCriteriaHistory();
    expect(history).toEqual(["BUND1"]);
  });
});
