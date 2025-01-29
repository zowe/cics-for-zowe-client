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

import { ITCPIP } from "@zowe/cics-for-zowe-sdk";
import { TCPIPMeta } from "../../../src/doc/TCPIPMeta";

describe("TCP IP Meta", () => {

  let tcpipMock: ITCPIP;

  beforeEach(() => {
    tcpipMock = {
      name: "MYTCPIP",
      eyu_cicsname: "MYREG",
      port: "12345"
    };
  });

  it("should return label", () => {
    const label = TCPIPMeta.getLabel(tcpipMock);
    expect(label).toEqual(`MYTCPIP [Port #12345]`);
  });
  it("should return label with no port", () => {
    // @ts-ignore
    tcpipMock.port = null;
    const label = TCPIPMeta.getLabel(tcpipMock);
    expect(label).toEqual(`MYTCPIP`);
  });

  it("should return context", () => {
    const context = TCPIPMeta.getContext(tcpipMock);
    expect(context).toEqual(`cicstcpips.MYTCPIP`);
  });

  it("should return icon name", () => {
    const iconName = TCPIPMeta.getIconName(tcpipMock);
    expect(iconName).toEqual(`program`);
  });
});
