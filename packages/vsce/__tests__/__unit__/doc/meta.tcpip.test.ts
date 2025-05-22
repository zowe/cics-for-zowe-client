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

import { TCPIPMeta } from "../../../src/doc/meta/tcpip.meta";
import { ITCPIP } from "../../../src/doc/resources/ITCPIP";
import { Resource } from "../../../src/resources";

describe("TCP IP Meta", () => {
  let tcpipMock: Resource<ITCPIP>;

  beforeEach(() => {
    tcpipMock = new Resource({
      name: "MYTCPIP",
      eyu_cicsname: "MYREG",
      port: "12345",
      status: "ENABLED",
    });
  });

  it("should build criteria", () => {
    const crit = TCPIPMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`name=a OR name=b`);
  });
  it("should return label", () => {
    const label = TCPIPMeta.getLabel(tcpipMock);
    expect(label).toEqual(`MYTCPIP [Port #12345]`);
  });
  it("should return label with no port", () => {
    // @ts-ignore - cannot be null
    tcpipMock.attributes.port = null;
    const label = TCPIPMeta.getLabel(tcpipMock);
    expect(label).toEqual(`MYTCPIP`);
  });

  it("should return context", () => {
    const context = TCPIPMeta.getContext(tcpipMock);
    expect(context).toEqual(`CICSTCPIPService.MYTCPIP`);
  });

  it("should return icon name", () => {
    const iconName = TCPIPMeta.getIconName(tcpipMock);
    expect(iconName).toEqual(`tcp-ip-service`);
  });
  it("should get name", () => {
    const name = TCPIPMeta.getName(tcpipMock);
    expect(name).toEqual("MYTCPIP");
  });

  it("should return highlights", () => {
    const highlights = TCPIPMeta.getHighlights(tcpipMock);
    expect(highlights).toEqual([
      {
        key: "Port",
        value: "12345",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "TCP1";
    await TCPIPMeta.appendCriteriaHistory(criteria);
    let history = TCPIPMeta.getCriteriaHistory();
    expect(history).toEqual(["TCP1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "TCP1";
    await TCPIPMeta.appendCriteriaHistory(criteria);
    let history = TCPIPMeta.getCriteriaHistory();
    expect(history).toEqual(["TCP1"]);
  });
});
