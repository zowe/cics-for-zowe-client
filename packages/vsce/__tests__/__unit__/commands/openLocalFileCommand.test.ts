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

import { commands, TreeView, window } from "vscode";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { LocalFileCommandHandler } from "../../../src/commands/LocalFileCommandHandler";
import { CICSTree } from "../../../src/trees/CICSTree";
import type { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import * as commandUtils from "../../../src/utils/commandUtils";
import * as actionResourceCommand from "../../../src/commands/actionResourceCommand";

jest.mock("vscode");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/commands/actionResourceCommand");

describe("openLocalFileCommand", () => {
  let mockTree: CICSTree;
  let mockTreeView: TreeView<CICSResourceContainerNode<IResource>>;
  let handler: LocalFileCommandHandler;

  /**
   * Helper function to setup command callback capture for testing
   * Sets up the mock and returns a function that invokes the captured callback
   */
  function setupCommandTest(): (node: Partial<CICSResourceContainerNode<IResource>>) => Promise<void> {
    let commandCallback: ((node: Partial<CICSResourceContainerNode<IResource>>) => Promise<void>) | undefined;
    jest.spyOn(commands, 'registerCommand').mockImplementation((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
    
    // Return a function that invokes the captured callback
    return (node: Partial<CICSResourceContainerNode<IResource>>) => {
      if (!commandCallback) {
        throw new Error('Command callback not captured');
      }
      return commandCallback(node);
    };
  }

  /**
   * Helper function to create mock nodes with specified labels
   */
  function createMockNodes(labels: string[]): Partial<CICSResourceContainerNode<IResource>>[] {
    return labels.map(label => ({ label }));
  }

  /**
   * Helper function to setup mock behavior for command tests
   */
  function setupMockBehavior(nodes: Partial<CICSResourceContainerNode<IResource>>[] | null) {
    (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(nodes);
    (actionResourceCommand.actionTreeItem as jest.Mock).mockResolvedValue(undefined);
    (window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);
  }

  /**
   * Helper function to verify actionTreeItem was called with expected parameters
   */
  function verifyActionTreeItemCall(expectedNodes: Partial<CICSResourceContainerNode<IResource>>[]) {
    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "OPEN",
        nodes: expectedNodes,
        tree: mockTree,
        parameter: undefined,
      })
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockTree = {} as CICSTree;
    mockTreeView = {} as TreeView<CICSResourceContainerNode<IResource>>;
    handler = new LocalFileCommandHandler(mockTree, mockTreeView);
  });

  it("should register the openLocalFile command", () => {
    setupCommandTest();
    handler.registerOpenCommand();

    expect(commands.registerCommand).toHaveBeenCalledWith(
      "cics-extension-for-zowe.openLocalFile",
      expect.any(Function)
    );
  });

  it("should open local file when nodes are selected", async () => {
    const invokeCommand = setupCommandTest();
    const mockNodes = createMockNodes(["FILE1", "FILE2"]);
    setupMockBehavior(mockNodes);

    handler.registerOpenCommand();
    await invokeCommand({});

    expect(commandUtils.findSelectedNodes).toHaveBeenCalled();
    verifyActionTreeItemCall(mockNodes);
    
    // Verify that customAction and getResourceName functions are provided
    const callArgs = (actionResourceCommand.actionTreeItem as jest.Mock).mock.calls[0][0];
    expect(typeof callArgs.customAction).toBe("function");
    expect(typeof callArgs.getResourceName).toBe("function");
  });

  it("should show error when no local files are selected", async () => {
    const invokeCommand = setupCommandTest();
    setupMockBehavior(null);

    handler.registerOpenCommand();
    await invokeCommand({});

    expect(window.showErrorMessage).toHaveBeenCalled();
    expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
  });

  it("should show error when empty array of nodes is returned", async () => {
    const invokeCommand = setupCommandTest();
    setupMockBehavior([]);

    handler.registerOpenCommand();
    await invokeCommand({});

    expect(window.showErrorMessage).toHaveBeenCalled();
    expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
  });
});


