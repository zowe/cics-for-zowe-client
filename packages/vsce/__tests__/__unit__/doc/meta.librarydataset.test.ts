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

import { ILibrary } from "../../../src/doc";
import { LibraryDatasetMeta } from "../../../src/doc/meta/libraryDataset.meta";
import { ILibraryDataset } from "../../../src/doc/resources/ILibraryDataset";
import { Resource } from "../../../src/resources";

describe("Library Dataset Meta", () => {
  let libraryDSMock: Resource<ILibraryDataset>;
  let parentLibraryMock: Resource<ILibrary>;

  beforeEach(() => {
    parentLibraryMock = new Resource({
      dsname: "MY.DSNAME",
      eyu_cicsname: "REG",
      name: "LIB1",
      ranking: "10",
      status: "ENABLED",
    });
    libraryDSMock = new Resource({
      dsname: "MY.DSNAME",
      eyu_cicsname: "MYREG",
      library: "LIB1",
      status: "ENABLED",
    });
  });

  it("should build criteria", () => {
    const crit = LibraryDatasetMeta.buildCriteria(["a", "b"], parentLibraryMock.attributes);
    expect(crit).toEqual(`LIBRARY=LIB1 AND (DSNAME=a OR DSNAME=b)`);
  });
  it("should get default criteria", async () => {
    const crit = await LibraryDatasetMeta.getDefaultCriteria(parentLibraryMock.attributes);
    expect(crit).toEqual(`LIBRARY=LIB1`);
  });
  it("should return label", () => {
    const label = LibraryDatasetMeta.getLabel(libraryDSMock);
    expect(label).toEqual(`MY.DSNAME`);
  });
  it("should return context", () => {
    const context = LibraryDatasetMeta.getContext(libraryDSMock);
    expect(context).toEqual(`CICSLibraryDatasetName.MY.DSNAME`);
  });
  it("should return icon name", () => {
    const iconName = LibraryDatasetMeta.getIconName(libraryDSMock);
    expect(iconName).toEqual(`library-dataset`);
  });
  it("should get name", () => {
    const name = LibraryDatasetMeta.getName(libraryDSMock);
    expect(name).toEqual("MY.DSNAME");
  });
  it("should have custom child type", async () => {
    const childTypeDefaultCriteria = await LibraryDatasetMeta.childType?.getDefaultCriteria(parentLibraryMock.attributes);
    expect(childTypeDefaultCriteria).toEqual(`(librarydsn='MY.DSNAME')`);
  });

  it("should return highlights", () => {
    const highlights = LibraryDatasetMeta.getHighlights(libraryDSMock);
    expect(highlights).toEqual([
      {
        key: "Library",
        value: "LIB1",
      }
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "LIB1";
    await LibraryDatasetMeta.appendCriteriaHistory(criteria);
    let history = LibraryDatasetMeta.getCriteriaHistory();
    expect(history).toEqual(["LIB1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "LIB1";
    await LibraryDatasetMeta.appendCriteriaHistory(criteria);
    let history = LibraryDatasetMeta.getCriteriaHistory();
    expect(history).toEqual(["LIB1"]);
  });
});
