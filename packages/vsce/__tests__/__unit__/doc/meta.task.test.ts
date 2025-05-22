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

import { TaskMeta } from "../../../src/doc/meta/task.meta";
import { ITask } from "../../../src/doc/resources/ITask";
import { Resource } from "../../../src/resources";

describe("Task Meta", () => {
  let taskMock: Resource<ITask>;

  beforeEach(() => {
    taskMock = new Resource({
      task: "MYTASK",
      eyu_cicsname: "MYREG",
      runstatus: "RUNNING",
      tranid: "TRAN",
      status: "ENABLED",
    });
  });

  it("should build criteria", () => {
    const crit = TaskMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`TRANID=a OR TRANID=b`);
  });
  it("should return label", () => {
    const label = TaskMeta.getLabel(taskMock);
    expect(label).toEqual(`MYTASK - TRAN (RUNNING)`);
  });
  it("should return label with suspended", () => {
    taskMock.attributes.runstatus = "SUSPENDED";
    const label = TaskMeta.getLabel(taskMock);
    expect(label).toEqual(`MYTASK - TRAN`);
  });

  it("should return context", () => {
    const context = TaskMeta.getContext(taskMock);
    expect(context).toEqual(`CICSTask.MYTASK`);
  });

  it("should return icon name", () => {
    const iconName = TaskMeta.getIconName(taskMock);
    expect(iconName).toEqual(`task-running`);
  });
  it("should return icon name with suspended", () => {
    taskMock.attributes.runstatus = "SUSPENDED";
    const iconName = TaskMeta.getIconName(taskMock);
    expect(iconName).toEqual(`task-suspended`);
  });
  it("should return icon name with dispatched", () => {
    taskMock.attributes.runstatus = "DISPATCHED";
    const iconName = TaskMeta.getIconName(taskMock);
    expect(iconName).toEqual(`task-dispatched`);
  });
  it("should get name", () => {
    const name = TaskMeta.getName(taskMock);
    expect(name).toEqual("MYTASK");
  });
});
