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
import { CICSTree } from "../../../src/trees/CICSTree";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import { IProgram } from "@zowe/cics-for-zowe-explorer-api";

jest.mock("vscode");
jest.mock("../../../src/commands/actionResourceCommand");
jest.mock("../../../src/utils/commandUtils");

describe("newCopyCommand", () => {
  let mockTree: CICSTree;
  let mockTreeview: TreeView<CICSResourceContainerNode<IProgram>>;
  let mockNode: CICSResourceContainerNode<IProgram>;
  let commandCallback: (node: CICSResourceContainerNode<IProgram>) => Promise<void>;

  const findSelectedNodesMock = findSelectedNodes as jest.Mock;

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
    findSelectedNodesMock.mockReturnValue([mockNode]);
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

  // Test data constants
  const INVALID_NODE_SCENARIOS: Array<{ desc: string; returnValue: CICSResourceContainerNode<IProgram>[] | null | undefined }> = [
    { desc: "no nodes selected", returnValue: [] },
    { desc: "null selection", returnValue: null },
    { desc: "undefined selection", returnValue: undefined },
  ];

  const CONTEXT_VALUE_TEST_CASES: Array<{ desc: string; contextValue: string | undefined | null; expectsParentResource: boolean }> = [
    {
      desc: "with PARENT.CICSLibraryDatasetName",
      contextValue: "CICS.Program.PARENT.CICSLibraryDatasetName",
      expectsParentResource: true,
    },
    {
      desc: "with PARENT.CICSLibraryDatasetName and additional context",
      contextValue: "CICS.Program.PARENT.CICSLibraryDatasetName.SomeOtherContext",
      expectsParentResource: true,
    },
    {
      desc: "without PARENT.CICSLibraryDatasetName",
      contextValue: "CICS.Program.SomeOtherContext",
      expectsParentResource: false,
    },
    {
      desc: "with empty string",
      contextValue: "",
      expectsParentResource: false,
    },
    {
      desc: "with case mismatch",
      contextValue: "CICS.Program.PARENT.cicslibrarydatasetname",
      expectsParentResource: false,
    },
    {
      desc: "with undefined",
      contextValue: undefined,
      expectsParentResource: false,
    },
    {
      desc: "with null",
      contextValue: null,
      expectsParentResource: false,
    },
  ];

  // Helper function to create mock program nodes with type safety
  function createMockProgramNode(overrides: Partial<CICSResourceContainerNode<IProgram>> = {}): CICSResourceContainerNode<IProgram> {
    return {
      ...mockNode,
      ...overrides,
    } as CICSResourceContainerNode<IProgram>;
  }


  // Helper function to execute the new copy command
  async function executeNewCopyCommand(node = mockNode) {
    getNewCopyCommand(mockTree, mockTreeview);
    await commandCallback(node);
  }

  // Helper function to assert actionTreeItem was called with expected parameters
  function expectActionTreeItemCalledWith(
    nodes: CICSResourceContainerNode<IProgram>[],
    includeParentResource = false
  ) {
    const expectedCall = {
      action: "NEWCOPY",
      nodes,
      tree: mockTree,
      ...(includeParentResource && { getParentResource: expect.any(Function) }),
    };
    
    expect(actionTreeItem).toHaveBeenCalledWith(expectedCall);
  }

  describe("newCopyProgram command execution", () => {
    it("should perform new copy on a program successfully", async () => {
      await executeNewCopyCommand();

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, ProgramMeta, mockNode);
      expectActionTreeItemCalledWith([mockNode]);
      expect(window.showErrorMessage).not.toHaveBeenCalled();
    });

    it("should handle multiple selected programs", async () => {
      const mockNode2 = createMockProgramNode({
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
      });

      findSelectedNodesMock.mockReturnValue([mockNode, mockNode2]);
      await executeNewCopyCommand();

      expectActionTreeItemCalledWith([mockNode, mockNode2]);
    });

    describe("error handling", () => {
      test.each(INVALID_NODE_SCENARIOS)(
        "should show error when $desc",
        async ({ returnValue }) => {
          findSelectedNodesMock.mockReturnValue(returnValue);
          await executeNewCopyCommand();

          expect(window.showErrorMessage).toHaveBeenCalled();
          expect(actionTreeItem).not.toHaveBeenCalled();
        }
      );
    });

    describe("contextValue handling", () => {
      test.each(CONTEXT_VALUE_TEST_CASES)(
        "should handle contextValue $desc",
        async ({ contextValue, expectsParentResource }) => {
          mockNode.contextValue = contextValue as string | undefined;
          await executeNewCopyCommand();

          expectActionTreeItemCalledWith([mockNode], expectsParentResource);
        }
      );

      it("should handle multiple programs from library dataset", async () => {
        const mockNode2 = createMockProgramNode({
          contextValue: "CICS.Program.PARENT.CICSLibraryDatasetName",
          getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
        });

        mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
        findSelectedNodesMock.mockReturnValue([mockNode, mockNode2]);
        await executeNewCopyCommand();

        expectActionTreeItemCalledWith([mockNode, mockNode2], true);
      });

      it("should handle mixed programs (some from library dataset, some not)", async () => {
        const mockNode2 = createMockProgramNode({
          contextValue: "CICS.Program",
          getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
        });

        mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
        findSelectedNodesMock.mockReturnValue([mockNode, mockNode2]);
        await executeNewCopyCommand();

        // Should use getParentResource based on the clicked node's contextValue
        expectActionTreeItemCalledWith([mockNode, mockNode2], true);
      });
    });

    describe("getParentResource callback", () => {
      it("should extract parent resource attributes correctly", async () => {
        mockNode.contextValue = "CICS.Program.PARENT.CICSLibraryDatasetName";
        await executeNewCopyCommand();

        const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
        const getParentResource = callArgs.getParentResource;

        // Create a mock parent node (library dataset) with the expected attributes
        const parentNode = createMockProgramNode({
          getContainedResource: jest.fn().mockReturnValue({
            resource: {
              attributes: {
                name: "TESTLIB",
                dsname: "TEST.DATASET",
              },
            },
          }),
        });

        const result = getParentResource(parentNode);
        expect(result).toEqual({
          name: "TESTLIB",
          dsname: "TEST.DATASET",
        });
      });
    });
  });
});
