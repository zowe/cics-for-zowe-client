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

import { LibraryMeta } from "../../../src/doc/meta/library.meta";
import { ILibrary } from "../../../src/doc/resources/ILibrary";
import { Resource } from "../../../src/resources";

describe("Library Meta", () => {
  let libraryMock: Resource<ILibrary>;

  beforeEach(() => {
    libraryMock = new Resource({
      dsname: "MY.DSNAME",
      eyu_cicsname: "MYREG",
      name: "LIB1",
      ranking: "10",
      status: "ENABLED",
    });
  });

  it("should build criteria", () => {
    const crit = LibraryMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`name=a OR name=b`);
  });
  it("should return label", () => {
    const label = LibraryMeta.getLabel(libraryMock);
    expect(label).toEqual(`LIB1`);
  });
  it("should return context", () => {
    const context = LibraryMeta.getContext(libraryMock);
    expect(context).toEqual(`CICSLibrary.LIB1`);
  });
  it("should return icon name", () => {
    const iconName = LibraryMeta.getIconName(libraryMock);
    expect(iconName).toEqual(`library`);
  });
  it("should get name", () => {
    const name = LibraryMeta.getName(libraryMock);
    expect(name).toEqual("LIB1");
  });
});
