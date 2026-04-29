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

import { window, ProgressLocation, type Progress, type CancellationToken, EventEmitter } from "vscode";
import { actionTreeItem } from "../../../src/commands/actionResourceCommand";
import { setResource } from "../../../src/commands/setResource";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";
import { pollForCompleteAction } from "../../../src/utils/resourceUtils";
import { evaluateTreeNodes } from "../../../src/utils/treeUtils";
import { ProgramMeta } from "../../../src/doc/meta/program.meta";
import { CICSTree } from "../../../src/trees/CICSTree";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import type { imperative } from "@zowe/zowe-explorer-api";

jest.mock("vscode");
jest.mock("../../../src/commands/setResource");
jest.mock("../../../src/errors/CICSErrorHandler");
jest.mock("../../../src/utils/resourceUtils");
jest.mock("../../../src/utils/treeUtils");
jest.mock("../../../src/utils/PersistentStorage", () => ({
  default: {
    getLoadedCICSProfiles: jest.fn().mockReturnValue([]),
    getCriteria: jest.fn().mockReturnValue(""),
  },
}));
jest.mock("../../../src/utils/profileManagement");
jest.mock("../../../src/resources/SessionHandler");

describe("actionResourceCommand", () => {
  let mockNode: CICSResourceContainerNode<IResource>;
  let mockTree: CICSTree;
  let mockParentNode: CICSResourceContainerNode<IResource>;
  let mockProgress: Progress<{ message?: string; increment?: number }>;
  let mockToken: CancellationToken;
  let mockProfile: imperative.IProfileLoaded;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock profile
    mockProfile = {
      name: "testProfile",
      type: "cics",
      profile: {},
      message: "",
      failNotFound: false,
    } as imperative.IProfileLoaded;

    // Create mock tree - use object literal with proper typing instead of instantiating
    const mockEventEmitter = new EventEmitter<CICSResourceContainerNode<IResource> | undefined>();
    mockEventEmitter.fire = jest.fn();
    
    mockTree = {
      refresh: jest.fn(),
      _onDidChangeTreeData: mockEventEmitter,
      loadedProfiles: [],
      getLoadedProfiles: jest.fn(() => []),
      getSessionNodeForProfile: jest.fn(),
      refreshLoadedProfiles: jest.fn(async () => {}),
      clearLoadedProfiles: jest.fn(),
      loadStoredProfileNames: jest.fn(),
      manageProfile: jest.fn(),
      addProfile: jest.fn(),
      removeSession: jest.fn(),
      getTreeItem: jest.fn(),
      getChildren: jest.fn(),
      getParent: jest.fn(),
      getConfigLocationPrompt: jest.fn(),
      getProfileIcon: jest.fn(),
    } as Partial<CICSTree> as CICSTree;

    // Create mock parent node
    mockParentNode = {
      refresh: jest.fn(),
      getProfileName: jest.fn(() => "testProfile"),
      getProfile: jest.fn(() => mockProfile),
      getParent: jest.fn(),
      getSession: jest.fn(),
      getLabel: jest.fn(),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

    // Create mock node with proper typing
    mockNode = {
      getProfileName: jest.fn(() => "testProfile"),
      getProfile: jest.fn(() => mockProfile),
      getParent: jest.fn(() => mockParentNode),
      getSession: jest.fn(),
      getLabel: jest.fn(),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
      getContainedResource: jest.fn(() => ({
        meta: ProgramMeta,
        resource: {
          attributes: {
            name: "TESTPROG",
            eyu_cicsname: "TESTREGION",
          },
        },
      })),
      getContainedResourceName: jest.fn(() => "TESTPROG"),
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

    mockProgress = {
      report: jest.fn(),
    } as Progress<{ message?: string; increment?: number }>;

    mockToken = {
      onCancellationRequested: jest.fn(),
      isCancellationRequested: false,
    } as CancellationToken;

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
        getContainedResourceName: jest.fn(() => "TESTPROG2"),
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

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
      const mockNode2 = { ...mockNode } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;
      const mockNode3 = { ...mockNode } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;
      const nodes = [mockNode, mockNode2, mockNode3];

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
        eyu_cicsname: "TESTREGION",
        attributes: {
          name: "PARENTRES",
        },
      };

      const getParentResource = jest.fn(() => mockParentResource);

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
      const pollCriteria = jest.fn(() => true);
      (pollForCompleteAction as jest.Mock) = jest.fn(() => Promise.resolve(undefined));

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
      const pollCriteria = jest.fn(() => true);
      const mockParentResource = { eyu_cicsname: "TESTREGION", attributes: { name: "PARENTRES" } };
      const getParentResource = jest.fn(() => mockParentResource);
      (pollForCompleteAction as jest.Mock) = jest.fn(() => Promise.resolve(undefined));

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
        getContainedResourceName: jest.fn(() => "TESTPROG2"),
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

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
        getParent: jest.fn(() => mockParentNode),
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      await actionTreeItem({
        action: "ENABLE",
        nodes: [mockNode, mockNode2],
        tree: mockTree,
      });

      expect(mockTree.refresh).toHaveBeenCalledTimes(1);
      expect(mockTree.refresh).toHaveBeenCalledWith(mockParentNode);
    });

    it("should handle different action types", async () => {
      const actions: Array<"ENABLE" | "DISABLE" | "NEWCOPY" | "PHASEIN"> = ["ENABLE", "DISABLE", "NEWCOPY", "PHASEIN"];

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

describe("customAction tests", () => {
let mockSession: { ISession: object };
let mockCustomAction: jest.Mock;

beforeEach(() => {
  mockSession = {
    ISession: {},
  };

  const SessionHandler = require("../../../src/resources/SessionHandler").SessionHandler;
  SessionHandler.getInstance = jest.fn(() => ({
    getProfile: jest.fn(() => mockProfile),
    getSession: jest.fn(() => mockSession),
  }));

  mockCustomAction = jest.fn(() => Promise.resolve({
    response: {
      resultsummary: {},
      records: [],
    },
  }));
});

it("should use customAction when provided", async () => {
  const getResourceName = jest.fn(() => "CUSTOMRES");

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(mockCustomAction).toHaveBeenCalledWith(mockSession, {
    name: "CUSTOMRES",
    regionName: "TESTREGION",
    cicsPlex: "TESTPLEX",
  });
  expect(setResource).not.toHaveBeenCalled();
  expect(getResourceName).toHaveBeenCalledWith(mockNode);
});

it("should pass parameter to customAction", async () => {
  const parameter = { name: "testParam", value: "testValue" };
  const getResourceName = jest.fn(() => "CUSTOMRES");

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
    parameter,
  });

  expect(mockCustomAction).toHaveBeenCalledWith(mockSession, {
    name: "CUSTOMRES",
    regionName: "TESTREGION",
    cicsPlex: "TESTPLEX",
    testParam: "testValue",
  });
});

it("should use eyu_cicsname when regionName is undefined with customAction", async () => {
  mockNode.regionName = undefined;
  const getResourceName = jest.fn(() => "CUSTOMRES");

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(mockCustomAction).toHaveBeenCalledWith(mockSession, {
    name: "CUSTOMRES",
    regionName: "TESTREGION",
    cicsPlex: "TESTPLEX",
  });
});

it("should report progress with custom message for customAction", async () => {
  const getResourceName = jest.fn(() => "CUSTOMRES");

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(mockProgress.report).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining("CUSTOMRES"),
    })
  );
});

it("should handle customAction errors and wrap them in CICSExtensionError", async () => {
  const error = new Error("Custom action failed");
  mockCustomAction.mockRejectedValueOnce(error);
  const getResourceName = jest.fn(() => "CUSTOMRES");

  const CICSExtensionError = require("../../../src/errors/CICSExtensionError").CICSExtensionError;

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(CICSErrorHandler.handleCMCIRestError).toHaveBeenCalled();
  expect(mockProgress.report).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining("Failed to enable"),
    })
  );
});

it("should show summary message for multiple nodes with customAction - all success", async () => {
  const mockNode2 = {
    ...mockNode,
    getContainedResourceName: jest.fn(() => "TESTPROG2"),
  } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

  const getResourceName = jest.fn()
    .mockReturnValueOnce("CUSTOMRES1")
    .mockReturnValueOnce("CUSTOMRES2");

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode, mockNode2],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(window.showInformationMessage).toHaveBeenCalledWith(
    expect.stringContaining("Successfully")
  );
});

it("should show warning message for multiple nodes with customAction - partial failure", async () => {
  const mockNode2 = {
    ...mockNode,
    getContainedResourceName: jest.fn(() => "TESTPROG2"),
  } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

  const getResourceName = jest.fn()
    .mockReturnValueOnce("CUSTOMRES1")
    .mockReturnValueOnce("CUSTOMRES2");

  mockCustomAction
    .mockResolvedValueOnce({ response: { resultsummary: {}, records: [] } })
    .mockRejectedValueOnce(new Error("Failed"));

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode, mockNode2],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(window.showWarningMessage).toHaveBeenCalledWith(
    expect.stringContaining("1 of 2")
  );
});

it("should show warning message for multiple nodes with customAction - all failed", async () => {
  const mockNode2 = {
    ...mockNode,
    getContainedResourceName: jest.fn(() => "TESTPROG2"),
  } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

  const getResourceName = jest.fn()
    .mockReturnValueOnce("CUSTOMRES1")
    .mockReturnValueOnce("CUSTOMRES2");

  mockCustomAction.mockRejectedValue(new Error("Failed"));

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode, mockNode2],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(window.showWarningMessage).toHaveBeenCalledWith(
    expect.stringContaining("Failed to enable all 2")
  );
});

it("should not show summary message for single node with customAction", async () => {
  const getResourceName = jest.fn(() => "CUSTOMRES");

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
    customAction: mockCustomAction,
    getResourceName,
  });

  expect(window.showInformationMessage).not.toHaveBeenCalled();
  expect(window.showWarningMessage).not.toHaveBeenCalled();
});

it("should use getResourceName when provided without customAction", async () => {
  const getResourceName = jest.fn(() => "CUSTOMNAME");

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
    getResourceName,
  });

  expect(getResourceName).toHaveBeenCalledWith(mockNode);
  expect(mockProgress.report).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining("1 of 1"),
    })
  );
});

it("should fall back to getContainedResourceName when getResourceName not provided", async () => {
  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
  });

  expect(mockNode.getContainedResourceName).toHaveBeenCalled();
});
});

describe("error handling edge cases", () => {
it("should continue processing after error in standard action", async () => {
  const mockNode2 = {
    ...mockNode,
    getContainedResourceName: jest.fn(() => "TESTPROG2"),
  } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

  (setResource as jest.Mock)
    .mockRejectedValueOnce(new Error("First error"))
    .mockResolvedValueOnce({ response: { resultsummary: {}, records: [] } });

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode, mockNode2],
    tree: mockTree,
  });

  expect(setResource).toHaveBeenCalledTimes(2);
  expect(CICSErrorHandler.handleCMCIRestError).toHaveBeenCalledTimes(1);
  expect(evaluateTreeNodes).toHaveBeenCalledTimes(1);
});

it("should handle error without customAction properly", async () => {
  (setResource as jest.Mock).mockRejectedValueOnce(new Error("Standard error"));

  await actionTreeItem({
    action: "ENABLE",
    nodes: [mockNode],
    tree: mockTree,
  });

  expect(CICSErrorHandler.handleCMCIRestError).toHaveBeenCalledWith(expect.any(Error));
});
});
});



