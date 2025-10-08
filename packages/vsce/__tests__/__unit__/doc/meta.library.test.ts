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

import { ILibrary } from "@zowe/cics-for-zowe-explorer-api";
import { LibraryMeta } from "../../../src/doc/meta/library.meta";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("Library Meta", () => {
  let libraryMock: Resource<ILibrary>;

  beforeEach(() => {
    libraryMock = new Resource({
      dsname: "MY.DSNAME",
      eyu_cicsname: "MYREG",
      name: "LIB1",
      ranking: "10",
      status: "ENABLED",
      enablestatus: "ENABLED",
    });
  });

  it("should build criteria", () => {
    const crit = LibraryMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`name=a OR name=b`);
  });
  it("should return only label if enabled", () => {
    const label = LibraryMeta.getLabel(libraryMock);
    expect(label).toEqual(`LIB1`);
  });
  it("should return label with disabled", () => {
    libraryMock.attributes.enablestatus = "DISABLED";
    const label = LibraryMeta.getLabel(libraryMock);
    expect(label).toEqual(`LIB1 (Disabled)`);
  });
  it("should return context with enabled status when enabled", () => {
    libraryMock.attributes.enablestatus = "ENABLED";
    const context = LibraryMeta.getContext(libraryMock);
    expect(context).toEqual(`CICSLibrary.ENABLED.LIB1`);
  });
  it("should return context with disabled status when disabled", () => {
    libraryMock.attributes.enablestatus = "DISABLED";
    const context = LibraryMeta.getContext(libraryMock);
    expect(context).toEqual(`CICSLibrary.DISABLED.LIB1`);
  });
  it("should return icon name", () => {
    const iconName = LibraryMeta.getIconName(libraryMock);
    expect(iconName).toEqual(`library`);
  });
  it("should return icon name when disabled", () => {
    libraryMock.attributes.enablestatus = "DISABLED";
    const iconName = LibraryMeta.getIconName(libraryMock);
    expect(iconName).toEqual(`library-disabled`);
  });
  it("should get name", () => {
    const name = LibraryMeta.getName(libraryMock);
    expect(name).toEqual("LIB1");
  });

  it("should return highlights", () => {
    const highlights = LibraryMeta.getHighlights(libraryMock);
    expect(highlights).toEqual([
      {
        key: "Ranking",
        value: "10",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "LIB1";
    await LibraryMeta.appendCriteriaHistory(criteria);
    let history = LibraryMeta.getCriteriaHistory();
    expect(history).toEqual(["LIB1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "LIB1";
    await LibraryMeta.appendCriteriaHistory(criteria);
    let history = LibraryMeta.getCriteriaHistory();
    expect(history).toEqual(["LIB1"]);
  });
});
