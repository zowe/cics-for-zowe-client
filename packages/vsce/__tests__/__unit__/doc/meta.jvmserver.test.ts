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

import { IJVMServer } from "@zowe/cics-for-zowe-explorer-api";
import { JVMServerMeta } from "../../../src/doc/meta/JVMServer.meta";
import { Resource } from "../../../src/resources";
import { workspaceConfigurationGetMock } from "../../__mocks__";

workspaceConfigurationGetMock.mockReturnValueOnce([]).mockReturnValue(["JVM1"]);

describe("JVMServer Meta", () => {
  let jvmserverMock: Resource<IJVMServer>;

  beforeEach(() => {
    jvmserverMock = new Resource({
      eyu_cicsname: "MYREG",
      name: "JVM1",
      status: "ENABLED",
      enablestatus: "ENABLED",
    });
  });
  it("should return icon name", () => {
    const iconName = JVMServerMeta.getIconName(jvmserverMock);
    expect(iconName).toEqual(`jvm-server`);
  });
  it("should build criteria", () => {
    const crit = JVMServerMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`name=a OR name=b`);
  });
  it("should return only label if enabled", () => {
    const label = JVMServerMeta.getLabel(jvmserverMock);
    expect(label).toEqual(`JVM1`);
  });
  it("should return label with disabled", () => {
    jvmserverMock.attributes.enablestatus = "DISABLED";
    const label = JVMServerMeta.getLabel(jvmserverMock);
    expect(label).toEqual(`JVM1 (Disabled)`);
  });
  it("should return context with enabled status when enabled", () => {
    jvmserverMock.attributes.enablestatus = "ENABLED";
    const context = JVMServerMeta.getContext(jvmserverMock);
    expect(context).toEqual(`CICSJVMServer.ENABLED.JVM1`);
  });
  it("should return context with disabled status when disabled", () => {
    jvmserverMock.attributes.enablestatus = "DISABLED";
    const context = JVMServerMeta.getContext(jvmserverMock);
    expect(context).toEqual(`CICSJVMServer.DISABLED.JVM1`);
  });
  it("should get name", () => {
    const name = JVMServerMeta.getName(jvmserverMock);
    expect(name).toEqual("JVM1");
  });

  it("should append criteria history", async () => {
    const criteria = "JVM1";
    await JVMServerMeta.appendCriteriaHistory(criteria);
    let history = JVMServerMeta.getCriteriaHistory();
    expect(history).toEqual(["JVM1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "JVM1";
    await JVMServerMeta.appendCriteriaHistory(criteria);
    let history = JVMServerMeta.getCriteriaHistory();
    expect(history).toEqual(["JVM1"]);
  });
});
