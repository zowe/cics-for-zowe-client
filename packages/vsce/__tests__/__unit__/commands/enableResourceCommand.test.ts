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

import { commands, window, TreeView } from "vscode";
import { getEnableResourceCommands } from "../../../src/commands/enableResourceCommand";
import { actionTreeItem } from "../../../src/commands/actionResourceCommand";
import { findSelectedNodes } from "../../../src/utils/commandUtils";
import {
  ProgramMeta,
  TransactionMeta,
  LocalFileMeta,
  LibraryMeta,
  BundleMeta,
  JVMServerMeta,
  JVMEndpointMeta,
} from "../../../src/doc";

jest.mock("vscode");
jest.mock("../../../src/commands/actionResourceCommand");
jest.mock("../../../src/utils/commandUtils");

describe("enableResourceCommand", () => {
  let mockTree: any;
  let mockTreeview: any;
  let mockNode: any;
  let commandCallbacks: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    commandCallbacks = new Map();

    mockTree = {
      refresh: jest.fn(),
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    mockTreeview = {} as TreeView<any>;

    mockNode = {
      getProfileName: jest.fn().mockReturnValue("testProfile"),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
      getContainedResource: jest.fn().mockReturnValue({
        resource: {
          attributes: {
            name: "TESTRES",
          },
        },
      }),
      getParent: jest.fn().mockReturnValue({
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: {
              name: "PARENTRES",
            },
          },
        }),
      }),
    };

    (commands.registerCommand as jest.Mock) = jest.fn((commandId, callback) => {
      commandCallbacks.set(commandId, callback);
      return { dispose: jest.fn() };
    });

    (actionTreeItem as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue([mockNode]);
    (window.showErrorMessage as jest.Mock) = jest.fn();
  });

  describe("getEnableResourceCommands", () => {
    it("should register all enable commands", () => {
      const disposables = getEnableResourceCommands(mockTree, mockTreeview);

      expect(disposables).toHaveLength(7);
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.enableProgram",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.enableTransaction",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.enableLocalFile",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.enableLibrary",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.enableBundle",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.enableJVMServer",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.enableJVMEndpoint",
        expect.any(Function)
      );
    });
  });

  describe("enableProgram", () => {
    it("should enable a program successfully", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableProgram");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, ProgramMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
      });
      expect(window.showErrorMessage).not.toHaveBeenCalled();
    });

    it("should show error when no programs selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableProgram");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining("No CICS"));
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should show error when nodes is null", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableProgram");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("enableTransaction", () => {
    it("should enable a transaction successfully", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableTransaction");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, TransactionMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should show error when no transactions selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableTransaction");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("enableLocalFile", () => {
    it("should enable a local file successfully", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableLocalFile");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, LocalFileMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should show error when no local files selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableLocalFile");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("enableLibrary", () => {
    it("should enable a library successfully", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableLibrary");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, LibraryMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should show error when no libraries selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableLibrary");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("enableBundle", () => {
    it("should enable a bundle with poll criteria", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableBundle");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, BundleMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
      });
    });

    it("should verify poll criteria returns true when enabled", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableBundle");

      await callback!(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const pollCriteria = callArgs.pollCriteria;

      const enabledResponse = {
        records: {
          cicsbundle: {
            enablestatus: "enabled",
          },
        },
      };

      expect(pollCriteria(enabledResponse)).toBe(true);
    });

    it("should verify poll criteria returns false when not enabled", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableBundle");

      await callback!(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const pollCriteria = callArgs.pollCriteria;

      const disabledResponse = {
        records: {
          cicsbundle: {
            enablestatus: "disabled",
          },
        },
      };

      expect(pollCriteria(disabledResponse)).toBe(false);
    });

    it("should show error when no bundles selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableBundle");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("enableJVMServer", () => {
    it("should enable a JVM server with poll criteria", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableJVMServer");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, JVMServerMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
      });
    });

    it("should verify JVM server poll criteria", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableJVMServer");

      await callback!(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const pollCriteria = callArgs.pollCriteria;

      const enabledResponse = {
        records: {
          cicsjvmserver: {
            enablestatus: "ENABLED",
          },
        },
      };

      expect(pollCriteria(enabledResponse)).toBe(true);
    });

    it("should show error when no JVM servers selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableJVMServer");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("enableJVMEndpoint", () => {
    it("should enable a JVM endpoint with parent resource and poll criteria", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableJVMEndpoint");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, JVMEndpointMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
        getParentResource: expect.any(Function),
        pollCriteria: expect.any(Function),
      });
    });

    it("should verify JVM endpoint getParentResource function", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableJVMEndpoint");

      await callback!(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const getParentResource = callArgs.getParentResource;

      const parentNode = {
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: {
              name: "PARENTJVM",
            },
          },
        }),
      };

      const result = getParentResource(parentNode);
      expect(result).toEqual({ name: "PARENTJVM" });
    });

    it("should verify JVM endpoint poll criteria", async () => {
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableJVMEndpoint");

      await callback!(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const pollCriteria = callArgs.pollCriteria;

      const enabledResponse = {
        records: {
          cicsjvmendpoint: {
            enablestatus: "enabled",
          },
        },
      };

      expect(pollCriteria(enabledResponse)).toBe(true);
    });

    it("should show error when no JVM endpoints selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getEnableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.enableJVMEndpoint");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });
});