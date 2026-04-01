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
import { getClearPlexFilterCommand } from "../../../src/commands/clearPlexFilterCommand";

jest.mock("vscode");
jest.mock("../../../src/trees/CICSTree");
jest.mock("../../../src/trees/CICSRegionsContainer");

describe("clearPlexFilterCommand", () => {
  let mockTree: any;
  let mockNode: any;
  let commandCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNode = {
      filterRegions: jest.fn(),
    };

    mockTree = {
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
  });

  it("should register the command", () => {
    getClearPlexFilterCommand(mockTree);
    expect(commands.registerCommand).toHaveBeenCalledWith(
      "cics-extension-for-zowe.clearPlexFilter",
      expect.any(Function)
    );
  });

  it("should call filterRegions with '*' and tree", async () => {
    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockNode.filterRegions).toHaveBeenCalledWith("*", mockTree);
  });
});


