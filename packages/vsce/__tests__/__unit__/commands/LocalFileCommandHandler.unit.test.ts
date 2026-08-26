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

import { commands, window, type TreeView, EventEmitter } from "vscode";
import { LocalFileCommandHandler } from "../../../src/commands/LocalFileCommandHandler";
import * as commandUtils from "../../../src/utils/commandUtils";
import * as actionResourceCommand from "../../../src/commands/actionResourceCommand";
import type { CICSTree } from "../../../src/trees/CICSTree";
import type { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import type { ILocalFile, IResource } from "@zowe/cics-for-zowe-explorer-api";
import { closeLocalFile, openLocalFile } from "@zowe/cics-for-zowe-sdk";

jest.mock("vscode");
jest.mock("../../../src/trees/CICSTree");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/commands/actionResourceCommand");
jest.mock("@zowe/cics-for-zowe-sdk");

describe("LocalFileCommandHandler", () => {
  let mockTree: Partial<CICSTree>;
  let mockTreeView: Partial<TreeView<CICSResourceContainerNode<ILocalFile>>>;
  let handler: LocalFileCommandHandler;
  let mockNodes: Array<Partial<CICSResourceContainerNode<ILocalFile>>>;

  /**
   * Helper function to setup command callback capture for testing
   * Sets up the mock and returns a function to get the captured callback
   */
  function setupCommandTest() {
    let commandCallback: ((node: any) => Promise<void>) | undefined;
    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
    return () => commandCallback!;
  }

  /**
   * Helper function to verify actionTreeItem was called with expected parameters
   * @param expectedAction - The expected action type
   * @param expectedParameter - The expected parameter object (optional)
   */
  function verifyActionTreeItemCall(expectedAction: string, expectedParameter?: { name: string; value: string }) {
    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: expectedAction,
      nodes: mockNodes,
      tree: mockTree,
      parameter: expectedParameter,
      customAction: expect.any(Function),
      getResourceName: expect.any(Function),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();

    mockNodes = [
      {
        label: "FILE1",
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { file: "FILE1" } },
        }),
      } as any,
      {
        label: "FILE2",
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { file: "FILE2" } },
        }),
      } as any,
    ];

    const mockEventEmitter = new EventEmitter<CICSResourceContainerNode<IResource> | undefined>();
    mockEventEmitter.fire = jest.fn();

    mockTree = {
      _onDidChangeTreeData: mockEventEmitter,
    };

    mockTreeView = {
      selection: mockNodes as CICSResourceContainerNode<ILocalFile>[],
    };

    handler = new LocalFileCommandHandler(mockTree as CICSTree, mockTreeView as TreeView<any>);

    (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue(mockNodes);
    (actionResourceCommand.actionTreeItem as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  describe("registerCloseCommand", () => {
    it("should register the close command", () => {
      setupCommandTest();
      handler.registerCloseCommand();
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.closeLocalFile",
        expect.any(Function)
      );
    });

    it("should show error when no nodes are selected", async () => {
      const getCallback = setupCommandTest();
      (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue(null);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      handler.registerCloseCommand();
      await getCallback()(null);

      expect(window.showErrorMessage).toHaveBeenCalledWith("No CICS local file selected");
      expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
    });

    it("should show error when empty nodes array is returned", async () => {
      const getCallback = setupCommandTest();
      (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue([]);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      handler.registerCloseCommand();
      await getCallback()(null);

      expect(window.showErrorMessage).toHaveBeenCalledWith("No CICS local file selected");
      expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
    });

    it("should prompt for busy parameter", async () => {
      const getCallback = setupCommandTest();
      (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Wait");

      handler.registerCloseCommand();
      await getCallback()(mockNodes[0]);

      expect(window.showInformationMessage).toHaveBeenCalledWith(
        "Choose one of the following for the file busy condition",
        "Wait",
        "No Wait",
        "Force"
      );
    });

    it("should return early if no choice is picked", async () => {
      const getCallback = setupCommandTest();
      (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      handler.registerCloseCommand();
      await getCallback()(mockNodes[0]);

      expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
    });

    it("should call actionTreeItem with WAIT when 'Wait' is selected", async () => {
      const getCallback = setupCommandTest();
      (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Wait");

      handler.registerCloseCommand();
      await getCallback()(mockNodes[0]);

      verifyActionTreeItemCall("CLOSE", { name: "busy", value: "WAIT" });
    });

    it("should call actionTreeItem with NOWAIT when 'No Wait' is selected", async () => {
      const getCallback = setupCommandTest();
      (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("No Wait");

      handler.registerCloseCommand();
      await getCallback()(mockNodes[0]);

      verifyActionTreeItemCall("CLOSE", { name: "busy", value: "NOWAIT" });
    });

    it("should call actionTreeItem with FORCE when 'Force' is selected", async () => {
      const getCallback = setupCommandTest();
      (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Force");

      handler.registerCloseCommand();
      await getCallback()(mockNodes[0]);

      verifyActionTreeItemCall("CLOSE", { name: "busy", value: "FORCE" });
    });

    it("should use closeLocalFile as the custom action", async () => {
      const getCallback = setupCommandTest();
      (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Wait");

      handler.registerCloseCommand();
      await getCallback()(mockNodes[0]);

      const callArgs = (actionResourceCommand.actionTreeItem as jest.Mock).mock.calls[0][0];
      expect(callArgs.customAction).toBe(closeLocalFile);
    });
  });

  describe("registerOpenCommand", () => {
    it("should register the open command", () => {
      setupCommandTest();
      handler.registerOpenCommand();
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.openLocalFile",
        expect.any(Function)
      );
    });

    it("should show error when no nodes are selected", async () => {
      const getCallback = setupCommandTest();
      (commandUtils.findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue(null);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      handler.registerOpenCommand();
      await getCallback()(null);

      expect(window.showErrorMessage).toHaveBeenCalledWith("No CICS local file selected");
      expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
    });

    it("should call actionTreeItem without parameter for open", async () => {
      const getCallback = setupCommandTest();
      handler.registerOpenCommand();
      await getCallback()(mockNodes[0]);

      verifyActionTreeItemCall("OPEN", undefined);
    });

    it("should use openLocalFile as the custom action", async () => {
      const getCallback = setupCommandTest();
      handler.registerOpenCommand();
      await getCallback()(mockNodes[0]);

      const callArgs = (actionResourceCommand.actionTreeItem as jest.Mock).mock.calls[0][0];
      expect(callArgs.customAction).toBe(openLocalFile);
    });
  });

  describe("registerAllCommands", () => {
    it("should register close and open commands", () => {
      const disposables = handler.registerAllCommands();
      
      expect(disposables).toHaveLength(2);
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.closeLocalFile",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.openLocalFile",
        expect.any(Function)
      );
    });
  });

  describe("getSdkFunction", () => {
    it("should throw error for unsupported action", async () => {
      const handler = new LocalFileCommandHandler(mockTree as CICSTree, mockTreeView as TreeView<any>);
      
      // Access private method through any cast for testing
      expect(() => {
        (handler as any).getSdkFunction("INVALID_ACTION");
      }).toThrow("Unsupported action: INVALID_ACTION");
    });
  });

  describe("getResourceName callback", () => {
    it("should extract file name from node", async () => {
      const getCallback = setupCommandTest();
      (window.showInformationMessage as jest.Mock) = jest.fn().mockResolvedValue("Wait");

      handler.registerCloseCommand();
      await getCallback()(mockNodes[0]);

      const callArgs = (actionResourceCommand.actionTreeItem as jest.Mock).mock.calls[0][0];
      const resourceName = callArgs.getResourceName(mockNodes[0]);
      
      expect(resourceName).toBe("FILE1");
    });
  });
});
