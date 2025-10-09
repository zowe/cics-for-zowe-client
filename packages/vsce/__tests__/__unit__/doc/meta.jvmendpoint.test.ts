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

import { JVMEndpointMeta } from "../../../src/doc/meta/jvmEndpoints.meta";
import { IJVMEndpoint } from "../../../src/doc/resources/IJVMEndpoint";
import { IJVMServer } from "../../../src/doc/resources/IJVMServer";
import { Resource } from "../../../src/resources";

describe("JVM Endpoint Meta", () => {
  let jvmEndpointMock: Resource<IJVMEndpoint>;
  let parentResource: Resource<IJVMServer>;

  beforeEach(() => {
    parentResource = new Resource<IJVMServer>({
      eyu_cicsname: "MYREG",
      name: "JVM1",
      status: "ENABLED",
      enablestatus: "ENABLED"
    });
    jvmEndpointMock = new Resource({
      eyu_cicsname: "MYREG",
      name: "JVME1",
      status: "ENABLED",
      enablestatus: "ENABLED",
      jvmendpoint: "JVME1", 
      jvmserver: "JVM1",
      port: "1420",
      secport: "N/A"
    });
  });

  it("should return icon name", () => {
    const iconName = JVMEndpointMeta.getIconName(jvmEndpointMock);
    expect(iconName).toEqual("jvm-server-endpoint");
  });

  it("should build criteria", () => {
    const label = JVMEndpointMeta.buildCriteria(["A", "B"], parentResource.attributes);
    expect(label).toEqual(`(JVMENDPOINT='A' OR JVMENDPOINT='B') AND (JVMSERVER='JVM1')`);
  });

  it("should return only label if enabled", () => {
    const label = JVMEndpointMeta.getLabel(jvmEndpointMock);
    expect(label).toEqual("JVME1 (1420)");
  });

  it("should return label with disabled", () => {
    jvmEndpointMock.attributes.enablestatus = "DISABLED";
    const label = JVMEndpointMeta.getLabel(jvmEndpointMock);
    expect(label).toEqual("JVME1 (1420) (Disabled)");
  });

  it("should return context with enabled status when enabled", () => {
    jvmEndpointMock.attributes.enablestatus = "ENABLED";
    const context = JVMEndpointMeta.getContext(jvmEndpointMock);
    expect(context).toEqual("CICSJVMEndpoint.ENABLED.JVME1");
  });

  it("should return context with disabled status when disabled", () => {
    jvmEndpointMock.attributes.enablestatus = "DISABLED";
    const context = JVMEndpointMeta.getContext(jvmEndpointMock);
    expect(context).toEqual("CICSJVMEndpoint.DISABLED.JVME1");
  });

  it("should get name", () => {
    const name = JVMEndpointMeta.getName(jvmEndpointMock);
    expect(name).toEqual("JVME1");
  });

  it("should append criteria history", async () => {
    const criteria = "JVME1";
    await JVMEndpointMeta.appendCriteriaHistory(criteria);
    let history = JVMEndpointMeta.getCriteriaHistory();
    expect(history).toEqual(["JVME1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "JVME1";
    await JVMEndpointMeta.appendCriteriaHistory(criteria);
    let history = JVMEndpointMeta.getCriteriaHistory();
    expect(history).toEqual(["JVME1"]);
  });
describe("JVMEndpointMeta.getLabel", () => {
  it("should show both secure port and port when both are present and not N/A", () => {
    jvmEndpointMock.attributes.secport = "9443";
    jvmEndpointMock.attributes.port = "9080";
    jvmEndpointMock.attributes.enablestatus = "ENABLED";
    expect(JVMEndpointMeta.getLabel(jvmEndpointMock)).toEqual("JVME1 (🔒9443 / 9080)");
  });

  it("should show only secure port when port is N/A", () => {
    jvmEndpointMock.attributes.secport = "9443";
    jvmEndpointMock.attributes.port = "N/A";
    expect(JVMEndpointMeta.getLabel(jvmEndpointMock)).toEqual("JVME1 (🔒9443)");
  });

  it("should show only port when secure port is N/A", () => {
    jvmEndpointMock.attributes.secport = "N/A";
    jvmEndpointMock.attributes.port = "9080";
    expect(JVMEndpointMeta.getLabel(jvmEndpointMock)).toEqual("JVME1 (9080)");
  });

  it("should show neither port nor secure port when both are N/A", () => {
    jvmEndpointMock.attributes.secport = "N/A";
    jvmEndpointMock.attributes.port = "N/A";
    expect(JVMEndpointMeta.getLabel(jvmEndpointMock)).toEqual("JVME1");
  });

  it("should append (Disabled) when enablestatus is disabled", () => {
    jvmEndpointMock.attributes.secport = "9443";
    jvmEndpointMock.attributes.port = "9080";
    jvmEndpointMock.attributes.enablestatus = "DISABLED";
    expect(JVMEndpointMeta.getLabel(jvmEndpointMock)).toEqual("JVME1 (🔒9443 / 9080) (Disabled)");
  });
});
});    