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
      profile: "DFHJVMPR",
      javahome: "/usr/lpp/java/J8.0_64",
      threadlimit: "15",
      log: "STDOUT",
      definetime: "2026-01-19T02:20:55.000000+00:00",
      changetime: "2026-01-20T10:30:00.000000+00:00",
      changeusrid: "ADMIN01",
    });
  });
  it("should return icon name when enabled", () => {
    const iconName = JVMServerMeta.getIconName(jvmserverMock);
    expect(iconName).toEqual(`jvm-server`);
  });

  it("should return icon name with disabled suffix when disabled", () => {
    jvmserverMock.attributes.enablestatus = "DISABLED";
    const iconName = JVMServerMeta.getIconName(jvmserverMock);
    expect(iconName).toEqual(`jvm-server-disabled`);
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

  it("should get default criteria", () => {
    const defaultCriteria = JVMServerMeta.getDefaultCriteria();
    expect(defaultCriteria).toBeDefined();
  });

  it("should get highlights", () => {
    const highlights = JVMServerMeta.getHighlights(jvmserverMock);
    expect(highlights).toBeDefined();
    expect(highlights.length).toBe(8);
    expect(highlights[0].key).toContain("Status");
    expect(highlights[0].value).toBe("ENABLED");
    expect(highlights[1].key).toContain("Profile");
    expect(highlights[1].value).toBe("DFHJVMPR");
    expect(highlights[2].key).toContain("Java Home");
    expect(highlights[2].value).toBe("/usr/lpp/java/J8.0_64");
    expect(highlights[3].key).toContain("Thread Limit");
    expect(highlights[3].value).toBe("15");
    expect(highlights[4].key).toContain("Log");
    expect(highlights[4].value).toBe("STDOUT");
    expect(highlights[5].key).toContain("Define Time");
    expect(highlights[5].value).toBe("2026-01-19T02:20:55.000000+00:00");
    expect(highlights[6].key).toContain("Change Time");
    expect(highlights[6].value).toBe("2026-01-20T10:30:00.000000+00:00");
    expect(highlights[7].key).toContain("Change User ID");
    expect(highlights[7].value).toBe("ADMIN01");
  });

  it("should have childType defined", () => {
    expect(JVMServerMeta.childType).toBeDefined();
    expect(Array.isArray(JVMServerMeta.childType)).toBe(true);
  });
});
