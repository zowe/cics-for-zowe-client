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
import { getDisableResourceCommands } from "../../../src/commands/disableResourceCommand";
import { actionTreeItem } from "../../../src/commands/actionResourceCommand";
import { findSelectedNodes } from "../../../src/utils/commandUtils";
import {
  ProgramMeta,
  TransactionMeta,
  LibraryMeta,
  BundleMeta,
  LocalFileMeta,
  JVMEndpointMeta,
  JVMServerMeta,
} from "../../../src/doc";

jest.mock("vscode");
jest.mock("../../../src/commands/actionResourceCommand");
jest.mock("../../../src/utils/commandUtils");

describe("disableResourceCommand", () => {
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
    (window.showInformationMessage as jest.Mock) = jest.fn();
  });

  describe("getDisableResourceCommands", () => {
    it("should register all disable commands", () => {
      const disposables = getDisableResourceCommands(mockTree, mockTreeview);

      expect(disposables).toHaveLength(7);
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.disableProgram",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.disableTransaction",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.disableLibrary",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.disableBundle",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.disableLocalFile",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.disableJVMEndpoint",
        expect.any(Function)
      );
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.disableJVMServer",
        expect.any(Function)
      );
    });
  });

  describe("disableProgram", () => {
    it("should disable a program successfully", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableProgram");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, ProgramMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
      });
      expect(window.showErrorMessage).not.toHaveBeenCalled();
    });

    it("should show error when no programs selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableProgram");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining("No CICS"));
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should show error when nodes is null", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableProgram");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("disableTransaction", () => {
    it("should disable a transaction successfully", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableTransaction");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, TransactionMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should show error when no transactions selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableTransaction");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("disableLibrary", () => {
    it("should disable a library successfully", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLibrary");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, LibraryMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should show error when no libraries selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLibrary");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("disableBundle", () => {
    it("should disable a bundle with poll criteria", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableBundle");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, BundleMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
      });
    });

    it("should verify poll criteria returns true when disabled", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableBundle");

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

      expect(pollCriteria(disabledResponse)).toBe(true);
    });

    it("should verify poll criteria returns false when not disabled", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableBundle");

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

      expect(pollCriteria(enabledResponse)).toBe(false);
    });

    it("should show error when no bundles selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableBundle");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("disableLocalFile", () => {
    it("should disable local file with Wait option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Wait");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLocalFile");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, LocalFileMeta, mockNode);
      expect(window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("file busy condition"),
        "Wait",
        "No Wait",
        "Force"
      );
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        parameter: { name: "BUSY", value: "WAIT" },
      });
    });

    it("should disable local file with No Wait option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("No Wait");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLocalFile");

      await callback!(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        parameter: { name: "BUSY", value: "NOWAIT" },
      });
    });

    it("should disable local file with Force option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Force");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLocalFile");

      await callback!(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        parameter: { name: "BUSY", value: "FORCE" },
      });
    });

    it("should not disable when user cancels selection", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLocalFile");

      await callback!(mockNode);

      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should show error when no local files selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLocalFile");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(window.showInformationMessage).not.toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should show error when nodes is null", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLocalFile");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should default to WAIT for unknown option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Unknown Option");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableLocalFile");

      await callback!(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        parameter: { name: "BUSY", value: "WAIT" },
      });
    });
  });

  describe("disableJVMEndpoint", () => {
    it("should disable JVM endpoint with parent resource and poll criteria", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMEndpoint");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, JVMEndpointMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        getParentResource: expect.any(Function),
        pollCriteria: expect.any(Function),
      });
    });

    it("should verify JVM endpoint getParentResource function", async () => {
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMEndpoint");

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
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMEndpoint");

      await callback!(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const pollCriteria = callArgs.pollCriteria;

      const disabledResponse = {
        records: {
          cicsjvmendpoint: {
            enablestatus: "disabled",
          },
        },
      };

      expect(pollCriteria(disabledResponse)).toBe(true);
    });

    it("should show error when no JVM endpoints selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMEndpoint");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });
  });

  describe("disableJVMServer", () => {
    it("should disable JVM server with Phase Out option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Phase Out");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, JVMServerMeta, mockNode);
      expect(window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("purge tasks"),
        "Phase Out",
        "Purge",
        "Force Purge",
        "Kill"
      );
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
        parameter: { name: "PURGETYPE", value: "PHASEOUT" },
      });
    });

    it("should disable JVM server with Purge option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
        parameter: { name: "PURGETYPE", value: "PURGE" },
      });
    });

    it("should disable JVM server with Force Purge option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Force Purge");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
        parameter: { name: "PURGETYPE", value: "FORCEPURGE" },
      });
    });

    it("should disable JVM server with Kill option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Kill");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
        parameter: { name: "PURGETYPE", value: "KILL" },
      });
    });

    it("should not disable when user cancels selection", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should verify JVM server poll criteria", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Phase Out");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const pollCriteria = callArgs.pollCriteria;

      const disabledResponse = {
        records: {
          cicsjvmserver: {
            enablestatus: "DISABLED",
          },
        },
      };

      expect(pollCriteria(disabledResponse)).toBe(true);
    });

    it("should show error when no JVM servers selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(window.showInformationMessage).not.toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should default to PHASEOUT for unknown option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Unknown Option");
      getDisableResourceCommands(mockTree, mockTreeview);
      const callback = commandCallbacks.get("cics-extension-for-zowe.disableJVMServer");

      await callback!(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "DISABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria: expect.any(Function),
        parameter: { name: "PURGETYPE", value: "PHASEOUT" },
      });
    });
  });
});