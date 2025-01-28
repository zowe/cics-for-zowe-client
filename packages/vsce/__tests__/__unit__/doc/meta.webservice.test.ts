import { IWebService } from "@zowe/cics-for-zowe-sdk";
import { WebServiceMeta } from "../../../src/doc/WebServiceMeta";

describe("WebService Meta", () => {

  let webserviceMock: IWebService;

  beforeEach(() => {
    webserviceMock = {
      name: "WEBSERV",
      eyu_cicsname: "MYREG"
    };
  });

  it("should return label", () => {
    const label = WebServiceMeta.getLabel(webserviceMock);
    expect(label).toEqual(`WEBSERV`);
  });

  it("should return context", () => {
    const context = WebServiceMeta.getContext(webserviceMock);
    expect(context).toEqual(`cicswebservice.WEBSERV`);
  });

  it("should return icon name", () => {
    const iconName = WebServiceMeta.getIconName(webserviceMock);
    expect(iconName).toEqual(`program`);
  });
});
