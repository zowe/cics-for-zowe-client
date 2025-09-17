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

import { RemoteFileMeta } from "../../../src/doc/meta/remoteFile.meta";
import { IRemoteFile } from "../../../src/doc/resources/IRemoteFile";
import { Resource } from "../../../src/resources";

describe("Remote File Meta", () => {
  let remoteFileMock: Resource<IRemoteFile>;

  beforeEach(() => {
    remoteFileMock = new Resource({
      enablestatus: "ENABLED",
      eyu_cicsname: "MYREG",
      remotename: "MYFILE",
      file: "MYFILE",
      remotesystem: "MYSYSTM",
      status: "ENABLED",
    });
  });

  it("should build criteria", () => {
    const crit = RemoteFileMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`file=a OR file=b`);
  });
  it("should return label", () => {
    const label = RemoteFileMeta.getLabel(remoteFileMock);
    expect(label).toEqual(`MYFILE`);
  });

  it("should return context", () => {
    const context = RemoteFileMeta.getContext(remoteFileMock);
    expect(context).toEqual(`CICSRemoteFile.MYFILE`);
  });

  it("should return icon name", () => {
    const iconName = RemoteFileMeta.getIconName(remoteFileMock);
    expect(iconName).toEqual(`remote-file`);
  });
  it("should get name", () => {
    const name = RemoteFileMeta.getName(remoteFileMock);
    expect(name).toEqual("MYFILE");
  });

  it("should return highlights", () => {
    const highlights = RemoteFileMeta.getHighlights(remoteFileMock);
    expect(highlights).toEqual([
      {
        key: "Remote System",
        value: "MYSYSTM",
      },
      {
        key: "Remote Name",
        value: "MYFILE",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "FILE1";
    await RemoteFileMeta.appendCriteriaHistory(criteria);
    let history = RemoteFileMeta.getCriteriaHistory();
    expect(history).toEqual(["FILE1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "FILE1";
    await RemoteFileMeta.appendCriteriaHistory(criteria);
    let history = RemoteFileMeta.getCriteriaHistory();
    expect(history).toEqual(["FILE1"]);
  });
});
