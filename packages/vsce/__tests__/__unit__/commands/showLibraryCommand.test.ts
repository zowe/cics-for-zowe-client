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
import { showLibraryCommand } from "../../../src/commands/showLibraryCommand";
import * as revealNodeInTree from "../../../src/commands/revealNodeInTree";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";
import { LibraryMeta } from "../../../src/doc";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/commands/revealNodeInTree");
jest.mock("../../../src/utils/workspaceUtils");

describe("showLibraryCommand", () => {
  let mockTree: any;
  let mockTreeview: any;
  let commandCallback: (node: any) => Promise<void>;
  const mockRegisterCommand = commands.registerCommand as jest.Mock;
  const mockShowErrorMessage = window.showErrorMessage as jest.Mock;
  const mockShowInformationMessage = window.showInformationMessage as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock tree
    mockTree = {
      getLoadedProfiles: jest.fn().mockReturnValue([]),
      refresh: jest.fn(),
    };

    // Setup mock treeview
    mockTreeview = {
      selection: [],
      reveal: jest.fn().mockResolvedValue(undefined),
    };

    // Mock workspace utils
    (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(true);

    // Register command and capture callback
    showLibraryCommand(mockTree, mockTreeview);
    commandCallback = mockRegisterCommand.mock.calls[0][1];
  });

  describe("Settings Check", () => {
    it("should return early if Library resources are hidden", async () => {
      (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(false);

      await commandCallback(null);

      expect(workspaceUtils.openSettingsForHiddenResourceType).toHaveBeenCalled();
      expect(revealNodeInTree.getCommandInvocationContext).not.toHaveBeenCalled();
    });
  });

  describe("Resource Inspector Invocation", () => {
    it("should detect Resource Inspector invocation", async () => {
      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { library: "TESTLIB", librarydsn: "TEST.LOADLIB" },
            context: {
              profile: { name: "TESTPROF" },
              regionName: "TESTREGION",
              cicsplexName: null as any,
            },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);
      
      // Mock tree structure to prevent errors
      mockTree.getLoadedProfiles.mockReturnValue([]);

      await commandCallback(null);

      // Verify context was checked
      expect(revealNodeInTree.getCommandInvocationContext).toHaveBeenCalled();
    });

    it("should show error when program has no library information", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { library: null as any, librarydsn: null as any },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No library information found for this program");
    });

    it("should show error when profile not found", async () => {
      mockTree.getLoadedProfiles.mockReturnValue([]);

      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { library: "TESTLIB", librarydsn: "TEST.LOADLIB" },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockRejectedValue(
        new Error("Profile 'TESTPROF' not found in the tree.")
      );

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("Profile 'TESTPROF' not found in the tree.");
    });

    it("should handle CICSplex scenario in Resource Inspector", async () => {
      const mockContext = {
        source: revealNodeInTree.InvocationSource.ResourceInspector,
        resources: [
          {
            resource: { library: "TESTLIB", librarydsn: "TEST.LOADLIB" },
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
        resourceMeta: LibraryMeta,
        resourceName: "TESTLIB",
        selectAndFocus: true,
        customSuccessMessage: "Library 'TESTLIB' revealed in the tree",
      });
    });
  });

  describe("Tree Node Invocation", () => {
    it("should detect tree node invocation", async () => {
      // Create a complete mock hierarchy
      const mockSessionNode: any = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
      };

      const mockRegionNode: any = {
        getRegionName: jest.fn().mockReturnValue("TESTREGION"),
        getParent: jest.fn().mockReturnValue(mockSessionNode),
        children: [
          {
            resourceTypes: [LibraryMeta],
            clearCriteria: jest.fn(),
            getFetcher: jest.fn().mockReturnValue({ reset: jest.fn().mockResolvedValue(undefined) }),
            setCriteria: jest.fn(),
            children: [],
          },
        ],
      };

      const mockProgramsContainer: any = {
        label: "Programs",
        getParent: jest.fn().mockReturnValue(mockRegionNode),
      };

      const mockNode: any = {
        getParent: jest.fn().mockReturnValue(mockProgramsContainer),
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: {
              library: "TESTLIB",
              librarydsn: "TEST.LOADLIB",
              eyu_cicsname: "TESTREGION",
            },
          },
        }),
        regionName: "TESTREGION",
        getProfileName: jest.fn().mockReturnValue("TESTPROF"),
      };

      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: [
          {
            resource: { library: "TESTLIB", librarydsn: "TEST.LOADLIB" },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(mockNode);

      // Verify context was checked
      expect(revealNodeInTree.getCommandInvocationContext).toHaveBeenCalled();
    });

    it("should show info message when no libraries found", async () => {
      const mockNode = {
        getParent: jest.fn().mockReturnValue({ label: "Programs" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: {
              library: null as any,
              librarydsn: null as any,
            },
          },
        }),
      };

      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: [
          {
            resource: { library: null, librarydsn: null },
            context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          },
        ],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(mockNode);

      expect(mockShowInformationMessage).toHaveBeenCalledWith("No libraries found in selected CICS programs");
    });
  });

  describe("No Selection", () => {
    it("should show error when no program is selected", async () => {
      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: [],
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Program selected");
    });

    it("should show error when resources is null", async () => {
      const mockContext: any = {
        source: revealNodeInTree.InvocationSource.RegionTree,
        resources: null,
        inspectorResources: undefined,
      };

      (revealNodeInTree.getCommandInvocationContext as jest.Mock).mockReturnValue(mockContext);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Program selected");
    });
  });
});