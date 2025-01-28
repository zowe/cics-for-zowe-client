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
