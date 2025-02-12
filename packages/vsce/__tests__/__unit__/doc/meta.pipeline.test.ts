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

import { IPipeline } from "@zowe/cics-for-zowe-sdk";
import { PipelineMeta } from "../../../src/doc/PipelineMeta";

describe("Pipeline Meta", () => {

  let pipelineMock: IPipeline;

  beforeEach(() => {
    pipelineMock = {
      name: "MYPIPE",
      eyu_cicsname: "MYREG"
    };
  });

  it("should return label", () => {
    const label = PipelineMeta.getLabel(pipelineMock);
    expect(label).toEqual(`MYPIPE`);
  });

  it("should return context", () => {
    const context = PipelineMeta.getContext(pipelineMock);
    expect(context).toEqual(`cicspipeline.MYPIPE`);
  });

  it("should return icon name", () => {
    const iconName = PipelineMeta.getIconName(pipelineMock);
    expect(iconName).toEqual(`program`);
  });
});
