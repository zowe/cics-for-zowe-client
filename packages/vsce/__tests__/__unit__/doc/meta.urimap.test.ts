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

import { URIMapMeta } from "../../../src/doc/meta/urimap.meta";
import { IURIMap } from "../../../src/doc/resources/IURIMap";
import { Resource } from "../../../src/resources";

describe("URIMap Meta", () => {
  let urimapMock: Resource<IURIMap>;

  beforeEach(() => {
    urimapMock = new Resource({
      name: "MYURI",
      eyu_cicsname: "MYREG",
      path: "/a/b/c",
      scheme: "http",
    });
  });

  it("should build criteria", () => {
    const crit = URIMapMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`name=a OR name=b`);
  });
  it("should return label", () => {
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI [http] (/a/b/c)`);
  });
  it("should return label with no scheme", () => {
    // @ts-ignore - cannot be null
    urimapMock.attributes.scheme = null;
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI (/a/b/c)`);
  });
  it("should return label with no path", () => {
    // @ts-ignore - cannot be null
    urimapMock.attributes.path = null;
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI [http]`);
  });
  it("should return label with no scheme or path", () => {
    // @ts-ignore - cannot be null
    urimapMock.attributes.path = null;
    // @ts-ignore - cannot be null
    urimapMock.attributes.scheme = null;
    const label = URIMapMeta.getLabel(urimapMock);
    expect(label).toEqual(`MYURI`);
  });

  it("should return context", () => {
    const context = URIMapMeta.getContext(urimapMock);
    expect(context).toEqual(`CICSURIMap.MYURI`);
  });

  it("should return icon name", () => {
    const iconName = URIMapMeta.getIconName(urimapMock);
    expect(iconName).toEqual(`uri-map`);
  });
  it("should get name", () => {
    const name = URIMapMeta.getName(urimapMock);
    expect(name).toEqual("MYURI");
  });
});
