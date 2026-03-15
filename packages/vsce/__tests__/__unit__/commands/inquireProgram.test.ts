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
import { getInquireProgramCommand } from "../../../src/commands/inquireProgram";
import * as revealNodeInTree from "../../../src/commands/revealNodeInTree";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";
import { ProgramMeta } from "../../../src/doc";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/commands/revealNodeInTree");
jest.mock("../../../src/utils/workspaceUtils");

describe("inquireProgram command", () => {
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
    getInquireProgramCommand(mockTree, mockTreeview);
    commandCallback = mockRegisterCommand.mock.calls[0][1];
  });

  describe("Settings Check", () => {
    it("should return early if Program resources are hidden", async () => {
      (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(false);

      await commandCallback(null);

      expect(workspaceUtils.openSettingsForHiddenResourceType).toHaveBeenCalled();
      expect(revealNodeInTree.getCommandInvocationContext).not.toHaveBeenCalled();
    });
  });

  describe("Resource Inspector Invocation", () => {
    it("should handle inquire program from Resource Inspector with valid program", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { tranid: "TEST", program: "TESTPROG" },
            context: {
              profile: { name: "TESTPROF" },
              regionName: "TESTREGION",
              cicsplexName: "TESTPLEX",
            },
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
        resourceMeta: ProgramMeta,
        resourceNames: ["TESTPROG"],
        clearFilter: false,
      });
    });

    it("should show error when transaction has no program", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { tranid: "TEST", program: null as any },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No program associated with this transaction");
      expect(revealNodeInTree.revealResourceInTree).not.toHaveBeenCalled();
    });

    it("should handle errors from revealResourceInTree", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { tranid: "TEST", program: "TESTPROG" },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      const error = new Error("Failed to reveal");
      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockRejectedValue(error);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("Failed to reveal");
    });
  });

  describe("Tree Node Invocation", () => {
    it("should handle inquire program from tree node", async () => {
      const mockParent = {
        label: "Transactions",
        getParent: jest.fn().mockReturnValue({
          children: [
            {
              resourceTypes: [ProgramMeta],
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
            attributes: { program: "TESTPROG" },
          },
        }),
      };

      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: [
          {
            resource: { program: "TESTPROG" },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(mockNode);

      expect(revealNodeInTree.revealResourceInTree).toHaveBeenCalled();
    });

    it("should handle All Local Transactions scenario", async () => {
      const mockParent = {
        label: "All Local Transactions",
      };

      const mockNode = {
        getParent: jest.fn().mockReturnValue(mockParent),
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: { program: "TESTPROG" },
          },
        }),
      };

      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.AllResourcesTree,
        resources: [
          {
            resource: { program: "TESTPROG" },
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
    it("should show error when no transaction is selected", async () => {
      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: [],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Transaction selected");
    });

    it("should show error when resources is null", async () => {
      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: null,
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Transaction selected");
    });
  });
});