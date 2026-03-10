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

jest.mock("../../../src/resources/actions", () => ({
  getBuiltInResourceActions: jest.fn(() => new Map()),
}));

import { ResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { Disposable } from "vscode";
import CICSResourceExtender from "../../../src/extending/CICSResourceExtender";

const mockAction1 = new ResourceAction({
  id: "action1",
  name: "Test Action 1",
  resourceType: ResourceTypes.CICSProgram,
  action: "actionCommand1",
});

const mockAction2 = new ResourceAction({
  id: "action2",
  name: "Test Action 2",
  resourceType: ResourceTypes.CICSProgram,
  action: "actionCommand2",
});

describe("Test suite for CICSResourceExtender", () => {
  let registerAction: Disposable;

  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    if (registerAction) {
      registerAction.dispose();
    }
  });

  it("should register a new action for a resource type", () => {
    registerAction = CICSResourceExtender.registerAction(mockAction1);

    const actions = CICSResourceExtender.getActionsFor(ResourceTypes.CICSProgram);
    expect(actions).toContain(mockAction1);
  });

  it("should dispose the registered action", () => {
    registerAction = CICSResourceExtender.registerAction(mockAction1);

    let action = CICSResourceExtender.getActionsFor(ResourceTypes.CICSProgram);
    expect(action).toContain(mockAction1);

    registerAction.dispose();

    action = CICSResourceExtender.getActionsFor(ResourceTypes.CICSProgram);
    expect(action).not.toContain(mockAction1);
  });

  it("should delete the actions if length is zero", () => {
    registerAction = CICSResourceExtender.registerAction(mockAction1);

    let action = CICSResourceExtender.getActionsFor(ResourceTypes.CICSProgram);
    expect(action).toContain(mockAction1);

    registerAction.dispose();

    action = CICSResourceExtender.getActionsFor(ResourceTypes.CICSProgram);
    expect(action).not.toContain(mockAction1);
    expect(CICSResourceExtender.getActions().length).toBe(0);
  });

  it("should return all registered actions", () => {
    CICSResourceExtender.registerAction(mockAction1);
    CICSResourceExtender.registerAction(mockAction2);

    const allActions = CICSResourceExtender.getActions();
    expect(allActions).toContain(mockAction1);
    expect(allActions).toContain(mockAction2);
  });

  it("should return a specific action by id", () => {
    CICSResourceExtender.registerAction(mockAction1);

    const foundAction = CICSResourceExtender.getAction("action1");
    expect(foundAction).toBe(mockAction1);
  });

  it("should return undefined when action is not found", () => {
    const foundAction = CICSResourceExtender.getAction("action3");
    expect(foundAction).toBeUndefined();
  });
});
