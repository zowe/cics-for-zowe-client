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

import { LocalFileMeta } from "../../../src/doc/meta/localFile.meta";
import { ILocalFile } from "../../../src/doc/resources/ILocalFile";
import { Resource } from "../../../src/resources";

describe("Local File Meta", () => {
  let localFileMock: Resource<ILocalFile>;

  beforeEach(() => {
    localFileMock = new Resource({
      file: "MYFILE",
      enablestatus: "ENABLED",
      eyu_cicsname: "MYREG",
      openstatus: "OPEN",
      browse: "BROWSABLE",
      dsname: "MY.DATASET",
      keylength: "80",
      read: "READABLE",
      recordsize: "100",
      status: "ENABLED",
      vsamtype: "VSAM",
    });
  });

  it("should build criteria", () => {
    const crit = LocalFileMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`file=a OR file=b`);
  });
  it("should return label", () => {
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE`);
  });
  it("should return label with disabled", () => {
    localFileMock.attributes.enablestatus = "DISABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Disabled)`);
  });
  it("should return label with unenabled", () => {
    localFileMock.attributes.enablestatus = "UNENABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Unenabled)`);
  });
  it("should return label with closed", () => {
    localFileMock.attributes.openstatus = "CLOSED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Closed)`);
  });
  it("should return label with disabled and closed", () => {
    localFileMock.attributes.openstatus = "CLOSED";
    localFileMock.attributes.enablestatus = "DISABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Disabled) (Closed)`);
  });
  it("should return label with unenabled and closed", () => {
    localFileMock.attributes.openstatus = "CLOSED";
    localFileMock.attributes.enablestatus = "UNENABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Unenabled) (Closed)`);
  });

  it("should return context", () => {
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`CICSLocalFile.ENABLED.OPEN.MYFILE`);
  });
  it("should return context with disabled", () => {
    localFileMock.attributes.enablestatus = "DISABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`CICSLocalFile.DISABLED.OPEN.MYFILE`);
  });
  it("should return context with unenabled", () => {
    localFileMock.attributes.enablestatus = "UNENABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`CICSLocalFile.UNENABLED.OPEN.MYFILE`);
  });
  it("should return context with closed", () => {
    localFileMock.attributes.openstatus = "closed";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`CICSLocalFile.ENABLED.CLOSED.MYFILE`);
  });
  it("should return context with disabled and closed", () => {
    localFileMock.attributes.openstatus = "closed";
    localFileMock.attributes.enablestatus = "DISABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`CICSLocalFile.DISABLED.CLOSED.MYFILE`);
  });
  it("should return context with unenabled and closed", () => {
    localFileMock.attributes.openstatus = "closed";
    localFileMock.attributes.enablestatus = "UNENABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`CICSLocalFile.UNENABLED.CLOSED.MYFILE`);
  });

  it("should return icon name", () => {
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file`);
  });
  it("should return icon name with disabled", () => {
    localFileMock.attributes.enablestatus = "DISABLED";
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file-disabled`);
  });
  it("should return icon name with closed", () => {
    localFileMock.attributes.openstatus = "CLOSED";
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file-closed`);
  });
  it("should return icon name with closed and disabled", () => {
    localFileMock.attributes.openstatus = "CLOSED";
    localFileMock.attributes.enablestatus = "DISABLED";
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file-disabled-closed`);
  });
  it("should get name", () => {
    const name = LocalFileMeta.getName(localFileMock);
    expect(name).toEqual("MYFILE");
  });

  it("should return highlights", () => {
    const highlights = LocalFileMeta.getHighlights(localFileMock);
    expect(highlights).toEqual([
      {
        key: "Open status",
        value: "OPEN",
      },
      {
        key: "Enabled status",
        value: "ENABLED",
      },
      {
        key: "Type",
        value: "VSAM",
      },
      {
        key: "Permission",
        value: `READABLE, BROWSABLE`,
      },
      {
        key: "Key length",
        value: "80",
      },
      {
        key: "Record size",
        value: "100",
      },
      {
        key: "Data set name",
        value: "MY.DATASET",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "FILE1";
    await LocalFileMeta.appendCriteriaHistory(criteria);
    let history = LocalFileMeta.getCriteriaHistory();
    expect(history).toEqual(["FILE1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "FILE1";
    await LocalFileMeta.appendCriteriaHistory(criteria);
    let history = LocalFileMeta.getCriteriaHistory();
    expect(history).toEqual(["FILE1"]);
  });
});
