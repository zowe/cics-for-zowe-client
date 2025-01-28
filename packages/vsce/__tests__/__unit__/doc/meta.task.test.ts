import { ITask } from "@zowe/cics-for-zowe-sdk";
import { TaskMeta } from "../../../src/doc/TaskMeta";

describe("Task Meta", () => {

  let taskMock: ITask;

  beforeEach(() => {
    taskMock = {
      task: "MYTASK",
      eyu_cicsname: "MYREG",
      runstatus: "RUNNING",
      tranid: "TRAN"
    };
  });

  it("should return label", () => {
    const label = TaskMeta.getLabel(taskMock);
    expect(label).toEqual(`MYTASK - TRAN (RUNNING)`);
  });
  it("should return label with suspended", () => {
    taskMock.runstatus = "SUSPENDED";
    const label = TaskMeta.getLabel(taskMock);
    expect(label).toEqual(`MYTASK - TRAN`);
  });

  it("should return context", () => {
    const context = TaskMeta.getContext(taskMock);
    expect(context).toEqual(`cicstask.MYTASK`);
  });

  it("should return icon name", () => {
    const iconName = TaskMeta.getIconName(taskMock);
    expect(iconName).toEqual(`task-running`);
  });
  it("should return icon name with suspended", () => {
    taskMock.runstatus = "SUSPENDED";
    const iconName = TaskMeta.getIconName(taskMock);
    expect(iconName).toEqual(`task-suspended`);
  });
  it("should return icon name with dispatched", () => {
    taskMock.runstatus = "DISPATCHED";
    const iconName = TaskMeta.getIconName(taskMock);
    expect(iconName).toEqual(`task-dispatched`);
  });
});
