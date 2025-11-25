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

import { IURIMap } from "@zowe/cics-for-zowe-explorer-api";
import { URIMapMeta } from "../../../src/doc/meta/urimap.meta";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("URIMap Meta", () => {
  let urimapMock: Resource<IURIMap>;

  beforeEach(() => {
    urimapMock = new Resource({
      name: "MYURI",
      eyu_cicsname: "MYREG",
      path: "/a/b/c",
      scheme: "http",
      status: "ENABLED",
      enablestatus: "ENABLED",
      transaction: "CJXA",
      pipeline: "ABC",
      webservice: "DEF",
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

  it("should return highlights", () => {
    const highlights = URIMapMeta.getHighlights(urimapMock);
    expect(highlights).toEqual([
      {
        "key": "Scheme",
         "value": "http",
       },
      {
        "key": "Transaction",
         "value": "CJXA",
      },
      {
        "key": "Pipeline",
        "value": "ABC",
      },
      {
         "key": "Web Service",
         "value": "DEF",
      },
      {
        key: "Path",
        value: "/a/b/c",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "URI1";
    await URIMapMeta.appendCriteriaHistory(criteria);
    let history = URIMapMeta.getCriteriaHistory();
    expect(history).toEqual(["URI1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "URI1";
    await URIMapMeta.appendCriteriaHistory(criteria);
    let history = URIMapMeta.getCriteriaHistory();
    expect(history).toEqual(["URI1"]);
  });
});
