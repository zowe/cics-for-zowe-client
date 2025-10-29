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

import { ITSQueue } from "@zowe/cics-for-zowe-explorer-api";
import { TSQueueMeta } from "../../../src/doc/meta/tsqueue.meta";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("TS Queue Meta", () => {
  let tsQueueMock: Resource<ITSQueue>;

  beforeEach(() => {
    tsQueueMock = new Resource({
      status: "ENABLED",
      eyu_cicsname: "MYREG",
      enablestatus: "ENABLED",
      location: "MAIN",
      name: "MYQUEUE",
      numitems: "2",
    });
  });

  it("should build criteria", () => {
    const crit = TSQueueMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`NAME=a OR NAME=b`);
  });
  it("should return label", () => {
    const label = TSQueueMeta.getLabel(tsQueueMock);
    expect(label).toEqual(`MYQUEUE`);
  });
  it("should return context", () => {
    const context = TSQueueMeta.getContext(tsQueueMock);
    expect(context).toEqual(`CICSTSQueue.MYQUEUE`);
  });
  it("should return icon name", () => {
    const iconName = TSQueueMeta.getIconName(tsQueueMock);
    expect(iconName).toEqual(`tsqueue`);
  });
  it("should get name", () => {
    const name = TSQueueMeta.getName(tsQueueMock);
    expect(name).toEqual("MYQUEUE");
  });

  it("should return highlights", () => {
    const highlights = TSQueueMeta.getHighlights(tsQueueMock);
    expect(highlights).toEqual([
      {
        key: "Location",
        value: "MAIN",
      },
      {
        key: "Number of Items",
        value: "2",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "QUEUE";
    await TSQueueMeta.appendCriteriaHistory(criteria);
    let history = TSQueueMeta.getCriteriaHistory();
    expect(history).toEqual(["QUEUE"]);
  });

  it("should get criteria history", async () => {
    const criteria = "QUEUE";
    await TSQueueMeta.appendCriteriaHistory(criteria);
    let history = TSQueueMeta.getCriteriaHistory();
    expect(history).toEqual(["QUEUE"]);
  });
});
