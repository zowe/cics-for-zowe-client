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
