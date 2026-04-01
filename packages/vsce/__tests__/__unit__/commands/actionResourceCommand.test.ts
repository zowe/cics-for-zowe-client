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

import { window, ProgressLocation } from "vscode";
import { actionTreeItem } from "../../../src/commands/actionResourceCommand";
import { setResource } from "../../../src/commands/setResource";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";
import { pollForCompleteAction } from "../../../src/utils/resourceUtils";
import { evaluateTreeNodes } from "../../../src/utils/treeUtils";
import { ProgramMeta } from "../../../src/doc/meta/program.meta";

jest.mock("vscode");
jest.mock("../../../src/commands/setResource");
jest.mock("../../../src/errors/CICSErrorHandler");
jest.mock("../../../src/utils/resourceUtils");
jest.mock("../../../src/utils/treeUtils");

describe("actionResourceCommand", () => {
  let mockNode: any;
  let mockTree: any;
  let mockParentNode: any;
  let mockProgress: any;
  let mockToken: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParentNode = {
      refresh: jest.fn(),
    };

    mockNode = {
      getProfileName: jest.fn().mockReturnValue("testProfile"),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
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
      getParent: jest.fn().mockReturnValue(mockParentNode),
    };

    mockTree = {
      refresh: jest.fn(),
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    mockProgress = {
      report: jest.fn(),
    };

    mockToken = {
      onCancellationRequested: jest.fn(),
    };

    (window.withProgress as jest.Mock) = jest.fn().mockImplementation(async (options, callback) => {
      return callback(mockProgress, mockToken);
    });

    (setResource as jest.Mock) = jest.fn().mockResolvedValue({
      response: {
        resultsummary: {},
        records: [],
      },
    });

    (evaluateTreeNodes as jest.Mock) = jest.fn();
  });

  describe("actionTreeItem", () => {
    it("should process single node action", async () => {
      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
      });

      expect(window.withProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          location: ProgressLocation.Notification,
          cancellable: false,
        }),
        expect.any(Function)
      );

      expect(setResource).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: {
            profileName: "testProfile",
            regionName: "TESTREGION",
            cicsplexName: "TESTPLEX",
          },
          meta: ProgramMeta,
          resourceName: "TESTPROG",
          action: "ENABLE",
        })
      );

      expect(evaluateTreeNodes).toHaveBeenCalled();
      expect(mockTree.refresh).toHaveBeenCalledWith(mockParentNode);
    });

    it("should process multiple nodes", async () => {
      const mockNode2 = {
        ...mockNode,
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
      };

      await actionTreeItem({
        action: "DISABLE",
        nodes: [mockNode, mockNode2],
        tree: mockTree,
      });

      expect(setResource).toHaveBeenCalledTimes(2);
      expect(mockProgress.report).toHaveBeenCalledTimes(2);
      expect(mockTree.refresh).toHaveBeenCalledWith(mockParentNode);
    });

    it("should report progress for each node", async () => {
      const nodes = [mockNode, { ...mockNode }, { ...mockNode }];

      await actionTreeItem({
        action: "ENABLE",
        nodes,
        tree: mockTree,
      });

      expect(mockProgress.report).toHaveBeenCalledTimes(3);
      expect(mockProgress.report).toHaveBeenNthCalledWith(1, expect.objectContaining({
        increment: expect.any(Number),
      }));
    });

    it("should use eyu_cicsname when regionName is not available", async () => {
      mockNode.regionName = undefined;

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
      });

      expect(setResource).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            regionName: "TESTREGION",
          }),
        })
      );
    });

    it("should handle getParentResource function", async () => {
      const mockParentResource = {
        attributes: {
          name: "PARENTRES",
        },
      };

      const getParentResource = jest.fn().mockReturnValue(mockParentResource);

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
        getParentResource,
      });

      expect(getParentResource).toHaveBeenCalledWith(mockParentNode);
      expect(setResource).toHaveBeenCalledWith(
        expect.objectContaining({
          parentResource: mockParentResource,
        })
      );
    });

    it("should handle parameter option", async () => {
      const parameter = {
        name: "TESTPARAM",
        value: "TESTVALUE",
      };

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
        parameter,
      });

      expect(setResource).toHaveBeenCalledWith(
        expect.objectContaining({
          parameter,
        })
      );
    });

    it("should poll for completion when pollCriteria is provided", async () => {
      const pollCriteria = jest.fn().mockReturnValue(true);
      (pollForCompleteAction as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria,
      });

      expect(pollForCompleteAction).toHaveBeenCalledWith(
        mockNode,
        pollCriteria,
        expect.any(Function),
        undefined
      );

      expect(evaluateTreeNodes).not.toHaveBeenCalled();
    });

    it("should poll with parent resource when both pollCriteria and getParentResource are provided", async () => {
      const pollCriteria = jest.fn().mockReturnValue(true);
      const mockParentResource = { attributes: { name: "PARENTRES" } };
      const getParentResource = jest.fn().mockReturnValue(mockParentResource);
      (pollForCompleteAction as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
        pollCriteria,
        getParentResource,
      });

      expect(pollForCompleteAction).toHaveBeenCalledWith(
        mockNode,
        pollCriteria,
        expect.any(Function),
        mockParentResource
      );
    });

    it("should handle errors and continue processing other nodes", async () => {
      const mockNode2 = {
        ...mockNode,
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG2"),
      };

      (setResource as jest.Mock)
        .mockRejectedValueOnce(new Error("Test error"))
        .mockResolvedValueOnce({ response: { resultsummary: {}, records: [] } });

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode, mockNode2],
        tree: mockTree,
      });

      expect(CICSErrorHandler.handleCMCIRestError).toHaveBeenCalledWith(expect.any(Error));
      expect(setResource).toHaveBeenCalledTimes(2);
      expect(mockTree.refresh).toHaveBeenCalled();
    });

    it("should refresh only unique parent nodes", async () => {
      const mockNode2 = {
        ...mockNode,
        getParent: jest.fn().mockReturnValue(mockParentNode),
      };

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode, mockNode2],
        tree: mockTree,
      });

      expect(mockTree.refresh).toHaveBeenCalledTimes(1);
      expect(mockTree.refresh).toHaveBeenCalledWith(mockParentNode);
    });

    it("should handle different action types", async () => {
      const actions = ["ENABLE", "DISABLE", "NEWCOPY", "PHASEIN"] as const;

      for (const action of actions) {
        jest.clearAllMocks();
        
        await actionTreeItem({
          action,
          nodes: [mockNode],
          tree: mockTree,
        });

        expect(setResource).toHaveBeenCalledWith(
          expect.objectContaining({
            action,
          })
        );
      }
    });

    it("should register cancellation token handler", async () => {
      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode],
        tree: mockTree,
      });

      expect(mockToken.onCancellationRequested).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});


