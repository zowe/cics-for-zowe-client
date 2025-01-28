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
