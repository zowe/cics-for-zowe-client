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

import { ILocalFile } from "@zowe/cics-for-zowe-sdk";
import { LocalFileMeta } from "../../../src/doc/LocalFileMeta";

describe("Local File Meta", () => {

  let localFileMock: ILocalFile;

  beforeEach(() => {
    localFileMock = {
      file: "MYFILE",
      enablestatus: "ENABLED",
      eyu_cicsname: "MYREG",
      openstatus: "OPEN"
    };
  });

  it("should return label", () => {
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE`);
  });
  it("should return label with disabled", () => {
    localFileMock.enablestatus = "DISABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Disabled)`);
  });
  it("should return label with unenabled", () => {
    localFileMock.enablestatus = "UNENABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Unenabled)`);
  });
  it("should return label with closed", () => {
    localFileMock.openstatus = "CLOSED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Closed)`);
  });
  it("should return label with disabled and closed", () => {
    localFileMock.openstatus = "CLOSED";
    localFileMock.enablestatus = "DISABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Disabled) (Closed)`);
  });
  it("should return label with unenabled and closed", () => {
    localFileMock.openstatus = "CLOSED";
    localFileMock.enablestatus = "UNENABLED";
    const label = LocalFileMeta.getLabel(localFileMock);
    expect(label).toEqual(`MYFILE (Unenabled) (Closed)`);
  });

  it("should return context", () => {
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`cicslocalfile.enabled.open.MYFILE`);
  });
  it("should return context with disabled", () => {
    localFileMock.enablestatus = "DISABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`cicslocalfile.disabled.open.MYFILE`);
  });
  it("should return context with unenabled", () => {
    localFileMock.enablestatus = "UNENABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`cicslocalfile.unenabled.open.MYFILE`);
  });
  it("should return context with closed", () => {
    localFileMock.openstatus = "closed";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`cicslocalfile.enabled.closed.MYFILE`);
  });
  it("should return context with disabled and closed", () => {
    localFileMock.openstatus = "closed";
    localFileMock.enablestatus = "DISABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`cicslocalfile.disabled.closed.MYFILE`);
  });
  it("should return context with unenabled and closed", () => {
    localFileMock.openstatus = "closed";
    localFileMock.enablestatus = "UNENABLED";
    const context = LocalFileMeta.getContext(localFileMock);
    expect(context).toEqual(`cicslocalfile.unenabled.closed.MYFILE`);
  });

  it("should return icon name", () => {
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file`);
  });
  it("should return icon name with disabled", () => {
    localFileMock.enablestatus = "DISABLED";
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file-disabled`);
  });
  it("should return icon name with closed", () => {
    localFileMock.openstatus = "CLOSED";
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file-closed`);
  });
  it("should return icon name with closed and disabled", () => {
    localFileMock.openstatus = "CLOSED";
    localFileMock.enablestatus = "DISABLED";
    const iconName = LocalFileMeta.getIconName(localFileMock);
    expect(iconName).toEqual(`local-file-disabled-closed`);
  });
});
