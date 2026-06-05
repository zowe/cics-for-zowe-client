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

import { commands } from "vscode";
import { getToggleResourceSettingCommand } from "../../../src/commands/toggleResourceSettingCommand";

jest.mock("vscode");

describe("toggleResourceSettingCommand", () => {
  let registerCommandMock: jest.Mock;
  let executeCommandMock: jest.Mock;

  beforeEach(() => {
    registerCommandMock = jest.fn();
    executeCommandMock = jest.fn().mockResolvedValue(undefined);

    (commands.registerCommand as jest.Mock) = registerCommandMock;
    (commands.executeCommand as jest.Mock) = executeCommandMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should register the toggleResourceSetting command", () => {
    getToggleResourceSettingCommand();

    expect(registerCommandMock).toHaveBeenCalledWith("cics-extension-for-zowe.toggleResourceSetting", expect.any(Function));
  });

  it("should execute workbench.action.openSettings with correct parameter when command is invoked", async () => {
    let commandCallback: (() => Promise<void>) | undefined;

    registerCommandMock.mockImplementation((commandId: string, callback: () => Promise<void>) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });

    getToggleResourceSettingCommand();

    expect(commandCallback).toBeDefined();

    // Invoke the registered command callback
    await commandCallback!();

    expect(executeCommandMock).toHaveBeenCalledWith("workbench.action.openSettings", "zowe.cics.resources");
  });

  it("should return a disposable from registerCommand", () => {
    const mockDisposable = { dispose: jest.fn() };
    registerCommandMock.mockReturnValue(mockDisposable);

    const result = getToggleResourceSettingCommand();

    expect(result).toBe(mockDisposable);
  });
});

// Made with Bob
