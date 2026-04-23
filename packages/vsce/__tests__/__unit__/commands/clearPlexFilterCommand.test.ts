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

import { commands, EventEmitter } from "vscode";
import { getClearPlexFilterCommand } from "../../../src/commands/clearPlexFilterCommand";
import type { CICSTree } from "../../../src/trees/CICSTree";
import type { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";

jest.mock("vscode");
jest.mock("../../../src/trees/CICSTree");
jest.mock("../../../src/trees/CICSRegionsContainer");

describe("clearPlexFilterCommand", () => {
  let mockTree: Partial<CICSTree>;
  let mockNode: { filterRegions: jest.Mock };
  let commandCallback: (node: { filterRegions: jest.Mock }) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNode = {
      filterRegions: jest.fn(),
    };

    const mockEventEmitter = new EventEmitter<CICSResourceContainerNode<IResource> | undefined>();
    mockEventEmitter.fire = jest.fn();

    mockTree = {
      _onDidChangeTreeData: mockEventEmitter,
    };

    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
  });

  it("should register the command", () => {
    getClearPlexFilterCommand(mockTree as CICSTree);
    expect(commands.registerCommand).toHaveBeenCalledWith(
      "cics-extension-for-zowe.clearPlexFilter",
      expect.any(Function)
    );
  });

  it("should call filterRegions with '*' and tree", async () => {
    getClearPlexFilterCommand(mockTree as CICSTree);
    await commandCallback(mockNode);

    expect(mockNode.filterRegions).toHaveBeenCalledWith("*", mockTree);
  });
});


