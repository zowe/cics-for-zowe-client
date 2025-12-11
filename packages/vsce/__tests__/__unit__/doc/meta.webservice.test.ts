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

import { IWebService } from "@zowe/cics-for-zowe-explorer-api";
import { WebServiceMeta } from "../../../src/doc/meta/webservice.meta";
import { Resource } from "../../../src/resources";
import { workspaceConfigurationGetMock } from "../../__mocks__";

workspaceConfigurationGetMock.mockReturnValueOnce([]).mockReturnValue(["SRV1"]);

describe("WebService Meta", () => {
  let webserviceMock: Resource<IWebService>;

  beforeEach(() => {
    webserviceMock = new Resource({
      name: "WEBSERV",
      eyu_cicsname: "MYREG",
      status: "ENABLED",
      enablestatus: "ENABLED",
      state: "INSERVICE",
      wsbind: "/a/b/c",
      program: "RAJ02222",
      pipeline: "RAJ02222",
      urimap: "$635396",
      container: "DFHWS-DATA",
      wsdlfile: "abc",
    });
  });

  it("should build criteria", () => {
    const crit = WebServiceMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`name=a OR name=b`);
  });
  it("should return label", () => {
    const label = WebServiceMeta.getLabel(webserviceMock);
    expect(label).toEqual(`WEBSERV`);
  });

  it("should return context", () => {
    const context = WebServiceMeta.getContext(webserviceMock);
    expect(context).toEqual(`CICSWebService.WEBSERV`);
  });

  it("should return icon name", () => {
    const iconName = WebServiceMeta.getIconName(webserviceMock);
    expect(iconName).toEqual(`web-services`);
  });
  it("should get name", () => {
    const name = WebServiceMeta.getName(webserviceMock);
    expect(name).toEqual("WEBSERV");
  });

  it("should return highlights", () => {
    const highlights = WebServiceMeta.getHighlights(webserviceMock);
    expect(highlights).toEqual([
      {
        key: "Status",
        value: "INSERVICE",
      },
      {
        key: "WS Bind",
        value: "/a/b/c",
      },
      {
        key: "Program",
        value: "RAJ02222",
      },
      {
        key: "Pipeline",
        value: "RAJ02222",
      },
      {
        key: "URI Map",
        value: "$635396",
      },
      {
        key: "Container",
        value: "DFHWS-DATA",
      },
      {
        key: "WSDL File",
        value: "abc",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "SRV1";
    await WebServiceMeta.appendCriteriaHistory(criteria);
    let history = WebServiceMeta.getCriteriaHistory();
    expect(history).toEqual(["SRV1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "SRV1";
    await WebServiceMeta.appendCriteriaHistory(criteria);
    let history = WebServiceMeta.getCriteriaHistory();
    expect(history).toEqual(["SRV1"]);
  });
});
