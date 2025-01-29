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
