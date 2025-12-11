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

import { ISharedTSQueue } from "@zowe/cics-for-zowe-explorer-api";
import { SharedTSQueueMeta } from "../../../src/doc";
import { Resource } from "../../../src/resources";
import { workspaceConfigurationGetMock } from "../../__mocks__";

workspaceConfigurationGetMock.mockReturnValueOnce([]).mockReturnValue(["QUEUE"]);

describe("Shared TS Queue Meta", () => {
  let tsQueueMock: Resource<ISharedTSQueue>;

  beforeEach(() => {
    tsQueueMock = new Resource({
      eyu_cicsname: "MYREG",
      location: "MAIN",
      name: "MYQUEUE",
      poolname: "MYPOOL",
      hexname: "C8C54040404040404040404040404040",
    });
  });

  it("should build criteria", () => {
    const crit = SharedTSQueueMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`NAME=a OR NAME=b`);
  });
  it("should return label", () => {
    const label = SharedTSQueueMeta.getLabel(tsQueueMock);
    expect(label).toEqual(`MYQUEUE`);
  });
  it("should return context", () => {
    const context = SharedTSQueueMeta.getContext(tsQueueMock);
    expect(context).toEqual(`CICSSharedTSQueue.MYQUEUE`);
  });
  it("should return icon name", () => {
    const iconName = SharedTSQueueMeta.getIconName(tsQueueMock);
    expect(iconName).toEqual(`shared-tsqueue`);
  });
  it("should get name", () => {
    const name = SharedTSQueueMeta.getName(tsQueueMock);
    expect(name).toEqual("MYQUEUE");
  });

  it("should return highlights", () => {
    const highlights = SharedTSQueueMeta.getHighlights(tsQueueMock);
    expect(highlights).toEqual([
      {
        key: "Location",
        value: "MAIN",
      },
      {
        key: "Pool Name",
        value: "MYPOOL",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "QUEUE";
    await SharedTSQueueMeta.appendCriteriaHistory(criteria);
    let history = SharedTSQueueMeta.getCriteriaHistory();
    expect(history).toEqual(["QUEUE"]);
  });

  it("should get criteria history", async () => {
    const criteria = "QUEUE";
    await SharedTSQueueMeta.appendCriteriaHistory(criteria);
    let history = SharedTSQueueMeta.getCriteriaHistory();
    expect(history).toEqual(["QUEUE"]);
  });
});
