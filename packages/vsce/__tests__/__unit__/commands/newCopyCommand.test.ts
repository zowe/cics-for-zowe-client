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

import { commands, window, TreeView, Disposable } from "vscode";
import { getNewCopyCommand } from "../../../src/commands/newCopyCommand";
import { actionTreeItem } from "../../../src/commands/actionResourceCommand";
import { findSelectedNodes } from "../../../src/utils/commandUtils";
import { ProgramMeta } from "../../../src/doc";
import type { CICSResourceContainerNode } from "../../../src/trees";
import { CICSTree } from "../../../src/trees/CICSTree";
import type { IProgram } from "@zowe/cics-for-zowe-explorer-api";

jest.mock("vscode");
jest.mock("../../../src/commands/actionResourceCommand");
jest.mock("../../../src/utils/commandUtils");

describe("newCopyCommand", () => {
  let mockTree: CICSTree;
  let mockTreeview: TreeView<CICSResourceContainerNode<IProgram>>;
  let mockNode: CICSResourceContainerNode<IProgram>;
  let commandCallback: (node: CICSResourceContainerNode<IProgram>) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTree = new CICSTree();
    mockTreeview = {} as TreeView<CICSResourceContainerNode<IProgram>>;

    mockNode = {
      getProfileName: jest.fn().mockReturnValue("testProfile"),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
      contextValue: "CICS.Program",
      getContainedResource: jest.fn().mockReturnValue({
        meta: ProgramMeta,
        resource: {
          attributes: {
            name: "TESTPROG",
            eyu_cicsname: "TESTREGION",
          },
        },
      }),
      getContainedResourceName: jest.fn().mockReturnValue("TESTPROG"),
      getParent: jest.fn().mockReturnValue({
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: {
              name: "PARENTRES",
            },
          },
        }),
      }),
    } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

    (commands.registerCommand as jest.Mock) = jest.fn((commandId: string, callback: (node: CICSResourceContainerNode<IProgram>) => Promise<void>) => {
      commandCallback = callback;
      return { dispose: jest.fn() } as Disposable;
    });

    (actionTreeItem as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue([mockNode]);
    (window.showErrorMessage as jest.Mock) = jest.fn();
  });

  describe("getNewCopyCommand", () => {
    it("should register the newCopyProgram command", () => {
      getNewCopyCommand(mockTree, mockTreeview);

      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.newCopyProgram",
        expect.any(Function)
      );
    });

    it("should return a disposable", () => {
      const disposable = getNewCopyCommand(mockTree, mockTreeview);

      expect(disposable).toBeDefined();
      expect(disposable.dispose).toBeDefined();
    });
  });

  describe("newCopyProgram command execution", () => {
    it("should perform new copy on a program successfully", async () => {
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, ProgramMeta, mockNode);
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
      });
      expect(window.showErrorMessage).not.toHaveBeenCalled();
    });

    it("should handle multiple selected programs", async () => {
      const mockNode2 = {
        ...mockNode,
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      (findSelectedNodes as jest.Mock).mockReturnValue([mockNode, mockNode2]);
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode, mockNode2],
        tree: mockTree,
      });
    });

    it("should show error when no programs selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("No CICS")
      );
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should show error when nodes is null", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should show error when nodes is undefined", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(undefined);
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(actionTreeItem).not.toHaveBeenCalled();
    });

    it("should handle program from library dataset with parent resource", async () => {
      mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
        getParentResource: expect.any(Function),
      });
    });

    it("should verify getParentResource function extracts attributes correctly", async () => {
      mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      const getParentResource = callArgs.getParentResource;

      const testNode = {
        getContainedResource: jest.fn().mockReturnValue({
          resource: {
            attributes: {
              name: "TESTLIB",
              dsname: "TEST.DATASET",
            },
          },
        }),
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      const result = getParentResource(testNode);
      expect(result).toEqual({
        name: "TESTLIB",
        dsname: "TEST.DATASET",
      });
    });

    it("should handle program with PARENT.CICSLibraryDatasetName in contextValue", async () => {
      mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName.SomeOtherContext";
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
        getParentResource: expect.any(Function),
      });
    });

    it("should not use getParentResource when contextValue does not include PARENT.CICSLibraryDatasetName", async () => {
      mockNode.contextValue = "CICS.Program.SomeOtherContext";
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should handle program with undefined contextValue", async () => {
      mockNode.contextValue = undefined;
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should handle program with null contextValue", async () => {
      mockNode.contextValue = null as unknown as string;
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should handle multiple programs from library dataset", async () => {
      const mockNode2 = {
        ...mockNode,
        contextValue: "CICS.Program.PARENT.CICSLibraryDatasetName",
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
      (findSelectedNodes as jest.Mock).mockReturnValue([mockNode, mockNode2]);
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode, mockNode2],
        tree: mockTree,
        getParentResource: expect.any(Function),
      });
    });

    it("should handle mixed programs (some from library dataset, some not)", async () => {
      const mockNode2 = {
        ...mockNode,
        contextValue: "CICS.Program",
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
      (findSelectedNodes as jest.Mock).mockReturnValue([mockNode, mockNode2]);
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      // Should use getParentResource based on the clicked node's contextValue
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode, mockNode2],
        tree: mockTree,
        getParentResource: expect.any(Function),
      });
    });

    it("should call findSelectedNodes with correct parameters", async () => {
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(
        mockTreeview,
        ProgramMeta,
        mockNode
      );
    });

    it("should pass tree parameter to actionTreeItem", async () => {
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
      expect(callArgs.tree).toBe(mockTree);
    });

    it("should use NEWCOPY action for all scenarios", async () => {
      // Test regular program
      getNewCopyCommand(mockTree, mockTreeview);
      await commandCallback(mockNode);
      expect((actionTreeItem as jest.Mock).mock.calls[0][0].action).toBe("NEWCOPY");

      // Test program from library dataset
      jest.clearAllMocks();
      (findSelectedNodes as jest.Mock).mockReturnValue([mockNode]);
      mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
      getNewCopyCommand(mockTree, mockTreeview);
      await commandCallback(mockNode);
      expect((actionTreeItem as jest.Mock).mock.calls[0][0].action).toBe("NEWCOPY");
    });

    it("should handle empty contextValue string", async () => {
      mockNode.contextValue = "";
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
      });
    });

    it("should be case-sensitive when checking contextValue", async () => {
      mockNode.contextValue = "CICS.Program.PARENT.cicslibrarydatasetname";
      getNewCopyCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      // Should not match due to case difference
      expect(actionTreeItem).toHaveBeenCalledWith({
        action: "NEWCOPY",
        nodes: [mockNode],
        tree: mockTree,
      });
    });
  });
});
