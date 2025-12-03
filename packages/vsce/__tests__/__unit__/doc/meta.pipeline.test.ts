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

import { IPipeline } from "@zowe/cics-for-zowe-explorer-api";
import { PipelineMeta } from "../../../src/doc/meta/pipeline.meta";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("Pipeline Meta", () => {
  let pipelineMock: Resource<IPipeline>;

  beforeEach(() => {
    pipelineMock = new Resource({
      name: "MYPIPE",
      eyu_cicsname: "MYREG",
      status: "ENABLED",
      enablestatus: "ENABLED",
      soaplevel: "1.1",
      wsdir: "/a/b/c",
      configfile: "/a/b/c/def.xml",
    });
  });

  it("should build criteria", () => {
    const crit = PipelineMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`name=a OR name=b`);
  });
  it("should return label", () => {
    const label = PipelineMeta.getLabel(pipelineMock);
    expect(label).toEqual(`MYPIPE`);
  });

  it("should return context", () => {
    const context = PipelineMeta.getContext(pipelineMock);
    expect(context).toEqual(`CICSPipeline.MYPIPE`);
  });

  it("should return icon name", () => {
    const iconName = PipelineMeta.getIconName(pipelineMock);
    expect(iconName).toEqual(`pipeline`);
  });
  it("should get name", () => {
    const name = PipelineMeta.getName(pipelineMock);
    expect(name).toEqual("MYPIPE");
  });

  it("should return highlights", () => {
    const highlights = PipelineMeta.getHighlights(pipelineMock);
    expect(highlights).toEqual([
      {
        key: "Status",
        value: "ENABLED",
      },
      {
        key: "Soap Level",
        value: "1.1",
      },
      {
        key: "WS Directory",
        value: "/a/b/c",
      },
      {
        key: "Config File",
        value: "/a/b/c/def.xml",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "PIP1";
    await PipelineMeta.appendCriteriaHistory(criteria);
    let history = PipelineMeta.getCriteriaHistory();
    expect(history).toEqual(["PIP1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "PIP1";
    await PipelineMeta.appendCriteriaHistory(criteria);
    let history = PipelineMeta.getCriteriaHistory();
    expect(history).toEqual(["PIP1"]);
  });
});
