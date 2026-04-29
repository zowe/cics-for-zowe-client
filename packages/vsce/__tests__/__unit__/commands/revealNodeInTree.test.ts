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

import { type TreeView } from "vscode";
import {
  revealResourceInTree,
  revealChildResourcesInTree,
} from "../../../src/commands/revealNodeInTree";
import { CICSPlexTree, CICSRegionTree, CICSResourceContainerNode } from "../../../src/trees";
import type { CICSTree } from "../../../src/trees/CICSTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";

jest.mock("vscode");

describe("revealNodeInTree", () => {
  let mockTree: CICSTree;
  let mockTreeView: TreeView<CICSResourceContainerNode<IResource>>;
  let mockSessionNode: {
    getProfile: jest.Mock;
    children: CICSResourceContainerNode<IResource>[];
  };
  let mockRegionNode: {
    getRegionName: jest.Mock;
    getContainerNodeForResourceType: jest.Mock;
    children: CICSResourceContainerNode<IResource>[];
  };
  let mockResourceContainer: {
    reset: jest.Mock;
    setCriteria: jest.Mock;
    description: string;
    children: CICSResourceContainerNode<IResource>[];
  };
  let mockResourceMeta: {
    humanReadableNamePlural: string;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockResourceContainer = {
      reset: jest.fn(),
      setCriteria: jest.fn(),
      description: "",
      children: [],
    };

    mockRegionNode = {
      getRegionName: jest.fn().mockReturnValue("REGION1"),
      getContainerNodeForResourceType: jest.fn().mockReturnValue(mockResourceContainer),
      children: [],
    } as any;

    mockSessionNode = {
      getProfile: jest.fn().mockReturnValue({ name: "testProfile" }),
      children: [mockRegionNode as any],
    };

    mockTree = {
      getLoadedProfiles: jest.fn().mockReturnValue([mockSessionNode]),
      refresh: jest.fn(),
    } as Partial<CICSTree> as CICSTree;

    mockTreeView = {
      reveal: jest.fn().mockResolvedValue(undefined),
    } as Partial<TreeView<CICSResourceContainerNode<IResource>>> as TreeView<CICSResourceContainerNode<IResource>>;

    mockResourceMeta = {
      humanReadableNamePlural: "Programs",
    };
  });

  describe("revealResourceInTree", () => {
    it("should reveal resource in tree without plex", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      
      await revealResourceInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        undefined,
        "REGION1",
        mockResourceMeta as Parameters<typeof revealResourceInTree>[5],
        ["PROG1"]
      );

      expect(mockTreeView.reveal).toHaveBeenCalledTimes(3);
      expect(mockResourceContainer.reset).toHaveBeenCalled();
      expect(mockResourceContainer.setCriteria).toHaveBeenCalledWith(["PROG1"]);
      expect(mockTree.refresh).toHaveBeenCalledWith(mockResourceContainer);
    });

    it("should throw error when profile not found", async () => {
      (mockTree.getLoadedProfiles as jest.Mock).mockReturnValue([]);

      await expect(
        revealResourceInTree(
          mockTree,
          mockTreeView,
          "nonExistentProfile",
          undefined,
          "REGION1",
          mockResourceMeta as Parameters<typeof revealResourceInTree>[5],
          ["PROG1"]
        )
      ).rejects.toThrow();
    });

    it("should throw error when region not found", async () => {
      mockSessionNode.children = [];

      await expect(
        revealResourceInTree(
          mockTree,
          mockTreeView,
          "testProfile",
          undefined,
          "REGION1",
          mockResourceMeta as Parameters<typeof revealResourceInTree>[5],
          ["PROG1"]
        )
      ).rejects.toThrow();
    });

    it("should throw error when resource container not found", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      mockRegionNode.getContainerNodeForResourceType.mockReturnValue(null);

      await expect(
        revealResourceInTree(
          mockTree,
          mockTreeView,
          "testProfile",
          undefined,
          "REGION1",
          mockResourceMeta as Parameters<typeof revealResourceInTree>[5],
          ["PROG1"]
        )
      ).rejects.toThrow();
    });

    it("should reveal resource in tree with plex", async () => {
      const mockPlexNode = {
        plexName: "PLEX1",
        getChildren: jest.fn().mockResolvedValue([]),
        children: [] as CICSResourceContainerNode<IResource>[],
      };

      const mockRegionsContainer = {
        getChildren: jest.fn().mockResolvedValue([]),
        children: [mockRegionNode as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>],
      };

      Object.setPrototypeOf(mockPlexNode, CICSPlexTree.prototype);
      Object.setPrototypeOf(mockRegionsContainer, CICSRegionsContainer.prototype);
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);

      mockPlexNode.children = [mockRegionsContainer as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>];
      mockSessionNode.children = [mockPlexNode as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>];

      await revealResourceInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        "PLEX1",
        "REGION1",
        mockResourceMeta as Parameters<typeof revealResourceInTree>[5],
        ["PROG1"]
      );

      expect(mockPlexNode.getChildren).toHaveBeenCalled();
      expect(mockRegionsContainer.getChildren).toHaveBeenCalled();
      expect(mockTreeView.reveal).toHaveBeenCalledTimes(5);
    });

    it("should handle plex without regions container", async () => {
      const mockPlexNode = {
        plexName: "PLEX1",
        getChildren: jest.fn().mockResolvedValue([]),
        children: [] as any[],
      };

      Object.setPrototypeOf(mockPlexNode, CICSPlexTree.prototype);
      (mockSessionNode as any).children = [mockPlexNode];

      await expect(
        revealResourceInTree(
          mockTree,
          mockTreeView,
          "testProfile",
          "PLEX1",
          "REGION1",
          mockResourceMeta as Parameters<typeof revealResourceInTree>[5],
          ["PROG1"]
        )
      ).rejects.toThrow();
    });

    it("should set description with multiple criteria", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      
      await revealResourceInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        undefined,
        "REGION1",
        mockResourceMeta as Parameters<typeof revealResourceInTree>[5],
        ["PROG1", "PROG2", "PROG3"]
      );

      expect(mockResourceContainer.description).toBe("PROG1 OR PROG2 OR PROG3");
    });
  });

  describe("revealChildResourcesInTree", () => {
    it("should reveal child resources in tree", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      
      const mockParentNode = {
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { name: "PARENT1" } },
        }),
        clearCriteria: jest.fn(),
        setCriteria: jest.fn(),
        getFetcher: jest.fn().mockReturnValue({
          reset: jest.fn().mockResolvedValue(undefined),
        }),
      };

      mockResourceContainer.children = [mockParentNode as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>];

      const mockParentMeta = {
        getName: jest.fn().mockReturnValue("PARENT1"),
        humanReadableNamePlural: "Libraries",
      } as Partial<Parameters<typeof revealChildResourcesInTree>[5]> as Parameters<typeof revealChildResourcesInTree>[5];

      const childCriteriaMap = new Map([["PARENT1", ["CHILD1", "CHILD2"]]]);

      await revealChildResourcesInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        undefined,
        "REGION1",
        mockParentMeta,
        ["PARENT1"],
        childCriteriaMap
      );

      expect(mockParentNode.clearCriteria).toHaveBeenCalled();
      expect(mockParentNode.setCriteria).toHaveBeenCalledWith(["CHILD1", "CHILD2"]);
    });

    it("should handle parent without children", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      mockResourceContainer.children = [];

      const mockParentMeta = {
        getName: jest.fn(),
        humanReadableNamePlural: "Libraries",
      } as Partial<Parameters<typeof revealChildResourcesInTree>[5]> as Parameters<typeof revealChildResourcesInTree>[5];

      const childCriteriaMap = new Map([["PARENT1", ["CHILD1"]]]);

      await revealChildResourcesInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        undefined,
        "REGION1",
        mockParentMeta,
        ["PARENT1"],
        childCriteriaMap
      );

      // Should not throw error
      expect(mockTree.refresh).toHaveBeenCalled();
    });

    it("should skip parent nodes without getContainedResource", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      
      const mockParentNode = {
        // No getContainedResource method
        clearCriteria: jest.fn(),
      };

      mockResourceContainer.children = [mockParentNode as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>];

      const mockParentMeta = {
        getName: jest.fn(),
        humanReadableNamePlural: "Libraries",
      } as Partial<Parameters<typeof revealChildResourcesInTree>[5]> as Parameters<typeof revealChildResourcesInTree>[5];

      const childCriteriaMap = new Map([["PARENT1", ["CHILD1"]]]);

      await revealChildResourcesInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        undefined,
        "REGION1",
        mockParentMeta,
        ["PARENT1"],
        childCriteriaMap
      );

      expect(mockParentNode.clearCriteria).not.toHaveBeenCalled();
    });

    it("should handle parent without matching child criteria", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      
      const mockParentNode = {
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { name: "PARENT2" } },
        }),
        clearCriteria: jest.fn(),
      };

      mockResourceContainer.children = [mockParentNode as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>];

      const mockParentMeta = {
        getName: jest.fn().mockReturnValue("PARENT2"),
        humanReadableNamePlural: "Libraries",
      } as Partial<Parameters<typeof revealChildResourcesInTree>[5]> as Parameters<typeof revealChildResourcesInTree>[5];

      const childCriteriaMap = new Map([["PARENT1", ["CHILD1"]]]);

      await revealChildResourcesInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        undefined,
        "REGION1",
        mockParentMeta,
        ["PARENT2"],
        childCriteriaMap
      );

      expect(mockParentNode.clearCriteria).not.toHaveBeenCalled();
    });

    it("should handle empty child criteria", async () => {
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);
      
      const mockParentNode = {
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { name: "PARENT1" } },
        }),
        clearCriteria: jest.fn(),
      };

      mockResourceContainer.children = [mockParentNode as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>];

      const mockParentMeta = {
        getName: jest.fn().mockReturnValue("PARENT1"),
        humanReadableNamePlural: "Libraries",
      } as any as Parameters<typeof revealChildResourcesInTree>[5];

      const childCriteriaMap = new Map([["PARENT1", []]]);

      await revealChildResourcesInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        undefined,
        "REGION1",
        mockParentMeta,
        ["PARENT1"],
        childCriteriaMap
      );

      expect(mockParentNode.clearCriteria).not.toHaveBeenCalled();
    });

    it("should handle plex structure for child resources", async () => {
      const mockPlexNode = {
        plexName: "PLEX1",
        getChildren: jest.fn().mockResolvedValue([]),
        children: [] as any[],
      };

      const mockRegionsContainer = {
        getChildren: jest.fn().mockResolvedValue([]),
        children: [mockRegionNode] as any[],
      };

      Object.setPrototypeOf(mockPlexNode, CICSPlexTree.prototype);
      Object.setPrototypeOf(mockRegionsContainer, CICSRegionsContainer.prototype);
      Object.setPrototypeOf(mockRegionNode, CICSRegionTree.prototype);

      (mockPlexNode as any).children = [mockRegionsContainer];
      (mockSessionNode as any).children = [mockPlexNode];

      const mockParentNode = {
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { name: "PARENT1" } },
        }),
        clearCriteria: jest.fn(),
        setCriteria: jest.fn(),
        getFetcher: jest.fn().mockReturnValue({
          reset: jest.fn().mockResolvedValue(undefined),
        }),
      };

      mockResourceContainer.children = [mockParentNode as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>];

      const mockParentMeta = {
        getName: jest.fn().mockReturnValue("PARENT1"),
        humanReadableNamePlural: "Libraries",
      } as Partial<Parameters<typeof revealChildResourcesInTree>[5]> as Parameters<typeof revealChildResourcesInTree>[5];

      const childCriteriaMap = new Map([["PARENT1", ["CHILD1"]]]);

      await revealChildResourcesInTree(
        mockTree,
        mockTreeView,
        "testProfile",
        "PLEX1",
        "REGION1",
        mockParentMeta,
        ["PARENT1"],
        childCriteriaMap
      );

      expect(mockParentNode.setCriteria).toHaveBeenCalledWith(["CHILD1"]);
    });
  });
});


