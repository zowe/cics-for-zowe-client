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
import { getInquireTransactionCommand } from "../../../src/commands/inquireTransaction";
import * as revealNodeInTree from "../../../src/commands/revealNodeInTree";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";
import { TransactionMeta } from "../../../src/doc";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/commands/revealNodeInTree");
jest.mock("../../../src/utils/workspaceUtils");

describe("inquireTransaction command", () => {
  let mockTree: any;
  let mockTreeview: any;
  let commandCallback: (node: any) => Promise<void>;
  const mockRegisterCommand = commands.registerCommand as jest.Mock;
  const mockShowErrorMessage = window.showErrorMessage as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock tree
    mockTree = {
      getLoadedProfiles: jest.fn().mockReturnValue([]),
      refresh: jest.fn(),
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    // Setup mock treeview
    mockTreeview = {
      selection: [],
      reveal: jest.fn().mockResolvedValue(undefined),
    };

    // Mock workspace utils
    (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(true);

    // Register command and capture callback
    getInquireTransactionCommand(mockTree, mockTreeview);
    commandCallback = mockRegisterCommand.mock.calls[0][1];
  });

  describe("Settings Check", () => {
    it("should return early if Transaction resources are hidden", async () => {
      (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(false);

      await commandCallback(null);

      expect(workspaceUtils.openSettingsForHiddenResourceType).toHaveBeenCalled();
      expect(revealNodeInTree.getCommandInvocationContext).not.toHaveBeenCalled();
    });
  });

  describe("Resource Inspector - Task Resource", () => {
    it("should handle inquire transaction from task", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { tranid: "TEST1" },
            context: {
              profile: { name: "TESTPROF" },
              regionName: "TESTREGION",
            },
            meta: { resourceName: CicsCmciConstants.CICS_CMCI_TASK },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealResourceInTree).toHaveBeenCalledWith({
        tree: mockTree,
        treeview: mockTreeview,
        context: mockContext.resources[0].context,
        resourceMeta: TransactionMeta,
        resourceNames: ["TEST1"],
      });
    });

    it("should show error when task has no transaction", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { tranid: null as any },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
            meta: { resourceName: CicsCmciConstants.CICS_CMCI_TASK },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No transaction associated with this task");
    });
  });

  describe("Resource Inspector - Unsupported Resource", () => {
    it("should show error for unsupported resource type", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: {},
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
            meta: { resourceName: "UNSUPPORTED" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith(
        "This command can only be used with Task resources"
      );
    });
  });

  describe("Tree Node Invocation", () => {
    it("should handle inquire transaction from tree node", async () => {
      const mockParent = {
        label: "Tasks",
        getParent: jest.fn().mockReturnValue({
          children: [
            {
              resourceTypes: [TransactionMeta],
              setCriteria: jest.fn(),
              reset: jest.fn(),
            },
          ],
        }),
      };

      const mockNode = {
        getParent: jest.fn().mockReturnValue(mockParent),
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: { tranid: "TEST1" },
          },
        }),
      };

      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: [
          {
            resource: { tranid: "TEST1" },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(mockNode);

      expect(revealNodeInTree.revealResourceInTree).toHaveBeenCalled();
    });

    it("should handle All Tasks scenario", async () => {
      const mockParent = {
        label: "All Tasks",
      };

      const mockNode = {
        getParent: jest.fn().mockReturnValue(mockParent),
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: { tranid: "TEST1" },
          },
        }),
      };

      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.AllResourcesTree,
        resources: [
          {
            resource: { tranid: "TEST1" },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(mockNode);

      expect(revealNodeInTree.revealResourceInTree).toHaveBeenCalled();
    });
  });

  describe("No Selection", () => {
    it("should show error when no task is selected", async () => {
      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: [],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Task selected");
    });
  });
});