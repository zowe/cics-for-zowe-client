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

import { commands, window } from "vscode";
import { getCloseLocalFileCommand } from "../../../src/commands/closeLocalFileCommand";
import * as commandUtils from "../../../src/utils/commandUtils";
import * as actionResourceCommand from "../../../src/commands/actionResourceCommand";

jest.mock("vscode");
jest.mock("../../../src/trees/CICSTree");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/commands/actionResourceCommand");

describe("closeLocalFileCommand", () => {
  let mockTree: any;
  let mockTreeView: any;
  let commandCallback: any;
  let mockNodes: any[];

  beforeEach(() => {
    jest.clearAllMocks();

    mockNodes = [
      { label: "FILE1", resource: { name: "FILE1" } },
      { label: "FILE2", resource: { name: "FILE2" } },
    ];

    mockTree = {
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    mockTreeView = {
      selection: mockNodes,
    };

    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });

    (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue(mockNodes);
    (actionResourceCommand.actionTreeItem as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  it("should register the command", () => {
    getCloseLocalFileCommand(mockTree, mockTreeView);
    expect(commands.registerCommand).toHaveBeenCalledWith(
      "cics-extension-for-zowe.closeLocalFile",
      expect.any(Function)
    );
  });

  it("should show error when no nodes are selected", async () => {
    (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue(null);
    (window.showErrorMessage as jest.Mock) = jest.fn();

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(null);

    expect(window.showErrorMessage).toHaveBeenCalledWith("No CICS local file selected");
    expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
  });

  it("should show error when empty nodes array is returned", async () => {
    (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue([]);
    (window.showErrorMessage as jest.Mock) = jest.fn();

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(null);

    expect(window.showErrorMessage).toHaveBeenCalledWith("No CICS local file selected");
    expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
  });

  it("should show information message with busy choices", async () => {
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Wait");

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(window.showInformationMessage).toHaveBeenCalledWith(
      "Choose one of the following for the file busy condition",
      "Wait",
      "No Wait",
      "Force"
    );
  });

  it("should return early if no choice is picked", async () => {
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
  });

  it("should call actionTreeItem with WAIT when 'Wait' is selected", async () => {
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Wait");

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: "CLOSE",
      nodes: mockNodes,
      tree: mockTree,
      parameter: {
        name: "BUSY",
        value: "WAIT",
      },
    });
  });

  it("should call actionTreeItem with NOWAIT when 'No Wait' is selected", async () => {
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("No Wait");

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: "CLOSE",
      nodes: mockNodes,
      tree: mockTree,
      parameter: {
        name: "BUSY",
        value: "NOWAIT",
      },
    });
  });

  it("should call actionTreeItem with FORCE when 'Force' is selected", async () => {
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Force");

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: "CLOSE",
      nodes: mockNodes,
      tree: mockTree,
      parameter: {
        name: "BUSY",
        value: "FORCE",
      },
    });
  });

  it("should default to WAIT for unknown choice", async () => {
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Unknown");

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: "CLOSE",
      nodes: mockNodes,
      tree: mockTree,
      parameter: {
        name: "BUSY",
        value: "WAIT",
      },
    });
  });

  it("should handle single node selection", async () => {
    const singleNode = [mockNodes[0]];
    (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue(singleNode);
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Wait");

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: "CLOSE",
      nodes: singleNode,
      tree: mockTree,
      parameter: {
        name: "BUSY",
        value: "WAIT",
      },
    });
  });

  it("should handle multiple node selection", async () => {
    (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Force");

    getCloseLocalFileCommand(mockTree, mockTreeView);
    await commandCallback(mockNodes[0]);

    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: "CLOSE",
      nodes: mockNodes,
      tree: mockTree,
      parameter: {
        name: "BUSY",
        value: "FORCE",
      },
    });
  });
});