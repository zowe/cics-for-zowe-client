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

import { PipelineMeta } from "../../../src/doc/meta/pipeline.meta";
import { IPipeline } from "../../../src/doc/resources/IPipeline";
import { Resource } from "../../../src/resources";

describe("Pipeline Meta", () => {
  let pipelineMock: Resource<IPipeline>;

  beforeEach(() => {
    pipelineMock = new Resource({
      name: "MYPIPE",
      eyu_cicsname: "MYREG",
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
});
