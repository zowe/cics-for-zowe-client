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

import { window } from "vscode";
import { revealResourceInTree } from "../../../src/commands/revealNodeInTree";
import { ProgramMeta } from "../../../src/doc";
import { CICSPlexTree, CICSRegionTree } from "../../../src/trees";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";

// Mock dependencies
jest.mock("vscode");

describe("revealResourceInTree", () => {
  let mockTree: any;
  let mockTreeview: any;
  let mockSessionNode: any;
  let mockRegionNode: any;
  let mockResourceContainer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock resource container
    mockResourceContainer = {
      reset: jest.fn(),
      setCriteria: jest.fn(),
      clearCriteria: jest.fn(),
      description: undefined,
      getChildren: jest.fn().mockResolvedValue([]),
    };

    // Setup mock region node - must be instance of CICSRegionTree for instanceof check
    mockRegionNode = Object.create(CICSRegionTree.prototype);
    mockRegionNode.getRegionName = jest.fn().mockReturnValue("TESTREGION");
    mockRegionNode.getContainerNodeForResourceType = jest.fn().mockReturnValue(mockResourceContainer);

    // Setup mock session node
    mockSessionNode = {
      getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
      children: [mockRegionNode],
    };

    // Setup mock tree
    mockTree = {
      getLoadedProfiles: jest.fn().mockReturnValue([mockSessionNode]),
      refresh: jest.fn(),
    };

    // Setup mock treeview
    mockTreeview = {
      reveal: jest.fn().mockResolvedValue(undefined),
    };

    // Mock window methods
    (window.showInformationMessage as jest.Mock) = jest.fn();
    (window.showWarningMessage as jest.Mock) = jest.fn();
  });

  describe("Direct Region Navigation", () => {
    it("should navigate to region and reveal resource", async () => {
      await revealResourceInTree(
        mockTree,
        mockTreeview,
        "TESTPROF",
        undefined,
        "TESTREGION",
        ProgramMeta,
        ["PROG1"]
      );

      expect(mockTree.getLoadedProfiles).toHaveBeenCalled();
      expect(mockTreeview.reveal).toHaveBeenCalledWith(mockSessionNode, { expand: true, select: false, focus: false });
      expect(mockTreeview.reveal).toHaveBeenCalledWith(mockRegionNode, { expand: true, select: false, focus: false });
      expect(mockResourceContainer.reset).toHaveBeenCalled();
      expect(mockResourceContainer.setCriteria).toHaveBeenCalledWith(["PROG1"]);
      expect(mockTree.refresh).toHaveBeenCalledWith(mockResourceContainer);
    });

    it("should handle multiple criteria", async () => {
      await revealResourceInTree(
        mockTree,
        mockTreeview,
        "TESTPROF",
        undefined,
        "TESTREGION",
        ProgramMeta,
        ["PROG1", "PROG2", "PROG3"]
      );

      expect(mockResourceContainer.setCriteria).toHaveBeenCalledWith(["PROG1", "PROG2", "PROG3"]);
      expect(mockResourceContainer.description).toBe("PROG1 OR PROG2 OR PROG3");
    });
  });

  describe("CICSplex Navigation", () => {
    it("should navigate through CICSplex structure", async () => {
      // Create mock regions container - must be instance for instanceof check
      const mockRegionsContainer = Object.create(CICSRegionsContainer.prototype);
      mockRegionsContainer.getChildren = jest.fn().mockResolvedValue([]);
      mockRegionsContainer.children = [mockRegionNode];

      // Create mock plex node - must be instance for instanceof check
      const mockPlexNode = Object.create(CICSPlexTree.prototype);
      mockPlexNode.plexName = "TESTPLEX";
      mockPlexNode.getChildren = jest.fn().mockResolvedValue([]);
      mockPlexNode.children = [mockRegionsContainer];

      mockSessionNode.children = [mockPlexNode];

      await revealResourceInTree(
        mockTree,
        mockTreeview,
        "TESTPROF",
        "TESTPLEX",
        "TESTREGION",
        ProgramMeta,
        ["PROG1"]
      );

      expect(mockPlexNode.getChildren).toHaveBeenCalled();
      expect(mockRegionsContainer.getChildren).toHaveBeenCalled();
      expect(mockTreeview.reveal).toHaveBeenCalledWith(mockPlexNode, { expand: true, select: false, focus: false });
      expect(mockTreeview.reveal).toHaveBeenCalledWith(mockRegionsContainer, { expand: true, select: false, focus: false });
    });
  });

  describe("Error Cases", () => {
    it("should throw error when profile not found", async () => {
      mockTree.getLoadedProfiles.mockReturnValue([]);

      await expect(
        revealResourceInTree(
          mockTree,
          mockTreeview,
          "NOTFOUND",
          undefined,
          "TESTREGION",
          ProgramMeta,
          ["PROG1"]
        )
      ).rejects.toThrow("Profile 'NOTFOUND' not found in the tree.");
    });

    it("should throw error when region not found", async () => {
      mockSessionNode.children = [];

      await expect(
        revealResourceInTree(
          mockTree,
          mockTreeview,
          "TESTPROF",
          undefined,
          "NOTFOUND",
          ProgramMeta,
          ["PROG1"]
        )
      ).rejects.toThrow("Region 'NOTFOUND' not found");
    });

    it("should throw error when resource container not found", async () => {
      mockRegionNode.getContainerNodeForResourceType.mockReturnValue(null);

      await expect(
        revealResourceInTree(
          mockTree,
          mockTreeview,
          "TESTPROF",
          undefined,
          "TESTREGION",
          ProgramMeta,
          ["PROG1"]
        )
      ).rejects.toThrow("Programs resources not found in region 'TESTREGION'. They may be disabled in settings.");
    });
  });

});
