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

import { IUriMap } from "@zowe/cics-for-zowe-sdk";
import { URIMapMeta } from "../../../src/doc/URIMapMeta";

describe("URIMap Meta", () => {

  let urimapMock: IUriMap;

  beforeEach(() => {
    urimapMock = {
      name: "MYURI",
      eyu_cicsname: "MYREG",
      path: "/a/b/c",
      scheme: "http"
    };
  });

  it("should return label", () => {
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI [http] (/a/b/c)`);
  });
  it("should return label with no scheme", () => {
    // @ts-ignore
    urimapMock.scheme = null;
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI (/a/b/c)`);
  });
  it("should return label with no path", () => {
    // @ts-ignore
    urimapMock.path = null;
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI [http]`);
  });
  it("should return label with no scheme or path", () => {
    // @ts-ignore
    urimapMock.path = null;
    // @ts-ignore
    urimapMock.scheme = null;
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI`);
  });

  it("should return context", () => {
    const context = URIMapMeta.getContext(urimapMock);
    expect(context).toEqual(`cicsurimaps.MYURI`);
  });

  it("should return icon name", () => {
    const iconName = URIMapMeta.getIconName(urimapMock);
    expect(iconName).toEqual(`program`);
  });
});
