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

import { getCommandInvocationContext, InvocationSource } from "../../../src/commands/revealNodeInTree";
import { TransactionMeta, ProgramMeta } from "../../../src/doc";
import { ResourceInspectorViewProvider } from "../../../src/trees/ResourceInspectorViewProvider";
import * as commandUtils from "../../../src/utils/commandUtils";

// Mock dependencies
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/trees/ResourceInspectorViewProvider");

describe("getCommandInvocationContext", () => {
  let mockTreeview: any;
  let mockTree: any;
  let mockNode: any;
  let mockResourceInspector: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock treeview
    mockTreeview = {
      selection: [],
      reveal: jest.fn(),
    };

    // Setup mock tree
    mockTree = {
      getLoadedProfiles: jest.fn().mockReturnValue([]),
      refresh: jest.fn(),
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    // Setup mock node
    mockNode = {
      getParent: jest.fn(),
      getContainedResource: jest.fn().mockReturnValue({
        resource: { attributes: { tranid: "TEST", program: "TESTPROG" } },
        meta: TransactionMeta,
      }),
      getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
      getSession: jest.fn().mockReturnValue({}),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
    };

    // Setup mock resource inspector
    mockResourceInspector = {
      getResources: jest.fn(),
    };

    (ResourceInspectorViewProvider.getInstance as jest.Mock).mockReturnValue(mockResourceInspector);
  });

  describe("Tree Node Invocation", () => {
    it("should detect region tree invocation when node has parent", () => {
      const mockParent = { label: "Transactions" };
      mockNode.getParent.mockReturnValue(mockParent);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.RegionTree);
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].resource).toEqual({ tranid: "TEST", program: "TESTPROG" });
      expect(result.resources[0].context.regionName).toBe("TESTREGION");
      expect(ResourceInspectorViewProvider.getInstance).not.toHaveBeenCalled();
    });

    it("should detect AllResourcesTree invocation when parent label starts with 'All '", () => {
      const mockParent = { label: "All Local Transactions" };
      mockNode.getParent.mockReturnValue(mockParent);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.AllResourcesTree);
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].resource).toEqual({ tranid: "TEST", program: "TESTPROG" });
    });

    it("should handle multiple selected nodes from tree", () => {
      const mockParent = { label: "Programs" };
      const mockNode1 = {
        ...mockNode,
        getParent: jest.fn().mockReturnValue(mockParent),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "PROG1" } },
          meta: ProgramMeta,
        }),
      };
      const mockNode2 = {
        ...mockNode,
        getParent: jest.fn().mockReturnValue(mockParent),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "PROG2" } },
          meta: ProgramMeta,
        }),
      };
      const mockNodes = [mockNode1, mockNode2];

      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      const result = getCommandInvocationContext(mockTreeview, ProgramMeta, mockNode1, mockTree);

      expect(result.source).toBe(InvocationSource.RegionTree);
      expect(result.resources).toHaveLength(2);
      expect(result.resources[0].resource).toEqual({ program: "PROG1" });
      expect(result.resources[1].resource).toEqual({ program: "PROG2" });
    });
  });

  describe("Resource Inspector Invocation", () => {
    it("should detect Resource Inspector invocation when node has no parent", () => {
      mockNode.getParent.mockReturnValue(null);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      const mockInspectorResources = [
        {
          resource: { tranid: "TEST", program: "TESTPROG" },
          context: { profile: { name: "TESTPROF" }, regionName: "TESTREGION" },
          meta: TransactionMeta,
        },
      ];
      mockResourceInspector.getResources.mockReturnValue(mockInspectorResources);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.ResourceInspector);
      expect(result.resources).toEqual(mockInspectorResources);
      expect(ResourceInspectorViewProvider.getInstance).toHaveBeenCalledWith(null, mockTree);
    });

    it("should handle Resource Inspector with no resources", () => {
      mockNode.getParent.mockReturnValue(null);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      mockResourceInspector.getResources.mockReturnValue([]);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.ResourceInspector);
      expect(result.resources).toEqual([]);
    });

    it("should handle Resource Inspector with undefined resources", () => {
      mockNode.getParent.mockReturnValue(null);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      mockResourceInspector.getResources.mockReturnValue(undefined);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.ResourceInspector);
      expect(result.resources).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle no nodes found", () => {
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue([]);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.RegionTree);
      expect(result.resources).toEqual([]);
    });

    it("should handle null nodes", () => {
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(null);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.RegionTree);
      expect(result.resources).toEqual([]);
    });

    it("should handle undefined nodes", () => {
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(undefined);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.RegionTree);
      expect(result.resources).toEqual([]);
    });
  });

  describe("Different Resource Types", () => {
    it("should work with Program meta", () => {
      const mockParent = { label: "Programs" };
      mockNode.getParent.mockReturnValue(mockParent);
      mockNode.getContainedResource.mockReturnValue({
        resource: { attributes: { program: "TESTPROG" } },
        meta: ProgramMeta,
      });

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      const result = getCommandInvocationContext(mockTreeview, ProgramMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.RegionTree);
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].resource).toEqual({ program: "TESTPROG" });
      expect(commandUtils.findSelectedNodes).toHaveBeenCalledWith(mockTreeview, ProgramMeta, mockNode);
    });

    it("should work with Transaction meta", () => {
      const mockParent = { label: "Transactions" };
      mockNode.getParent.mockReturnValue(mockParent);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      const result = getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(result.source).toBe(InvocationSource.RegionTree);
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].resource).toEqual({ tranid: "TEST", program: "TESTPROG" });
      expect(commandUtils.findSelectedNodes).toHaveBeenCalledWith(mockTreeview, TransactionMeta, mockNode);
    });
  });

  describe("Resource Inspector getInstance", () => {
    it("should not call getInstance when node has parent", () => {
      const mockParent = { label: "Transactions" };
      mockNode.getParent.mockReturnValue(mockParent);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(ResourceInspectorViewProvider.getInstance).not.toHaveBeenCalled();
    });

    it("should call getInstance with correct parameters when node has no parent", () => {
      mockNode.getParent.mockReturnValue(null);

      const mockNodes = [mockNode];
      (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);

      mockResourceInspector.getResources.mockReturnValue([]);

      getCommandInvocationContext(mockTreeview, TransactionMeta, mockNode, mockTree);

      expect(ResourceInspectorViewProvider.getInstance).toHaveBeenCalledWith(null, mockTree);
    });
  });
});
