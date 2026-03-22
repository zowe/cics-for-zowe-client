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
import * as commandUtils from "../../../src/utils/commandUtils";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";
import { ProgramMeta, TransactionMeta } from "../../../src/doc";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/commands/revealNodeInTree");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/utils/workspaceUtils");

describe("inquireProgram command", () => {
  let mockTree: any;
  let mockTreeview: any;
  let commandCallback: (node: any) => Promise<void>;
  const mockRegisterCommand = commands.registerCommand as jest.Mock;
  const mockShowErrorMessage = window.showErrorMessage as jest.Mock;
  const mockFindSelectedNodes = commandUtils.findSelectedNodes as jest.Mock;

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
    getInquireProgramCommand(mockTree, mockTreeview);
    commandCallback = mockRegisterCommand.mock.calls[0][1];
  });

  describe("Settings Check", () => {
    it("should return early if Program resources are hidden", async () => {
      (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(false);

      await commandCallback(null);

      expect(workspaceUtils.openSettingsForHiddenResourceType).toHaveBeenCalled();
      expect(mockFindSelectedNodes).not.toHaveBeenCalled();
    });
  });

  describe("Valid Transaction with Program", () => {
    it("should extract program and reveal in tree", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: "TEST", program: "TESTPROG" } },
          meta: TransactionMeta,
        }),
        cicsplexName: "TESTPLEX",
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealResourceInTree).toHaveBeenCalledWith(
        mockTree,
        mockTreeview,
        "TESTPROF",
        "TESTPLEX",
        "TESTREGION",
        ProgramMeta,
        ["TESTPROG"]
      );
    });

    it("should handle transaction without CICSplex", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: "TEST", program: "TESTPROG" } },
          meta: TransactionMeta,
        }),
        cicsplexName: undefined as string | undefined,
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealResourceInTree).toHaveBeenCalledWith(
        mockTree,
        mockTreeview,
        "TESTPROF",
        undefined,
        "TESTREGION",
        ProgramMeta,
        ["TESTPROG"]
      );
    });

    it("should handle multiple transactions with different programs", async () => {
      const mockNode1 = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: "TEST1", program: "PROG1" } },
          meta: TransactionMeta,
        }),
        cicsplexName: undefined as string | undefined,
        regionName: "TESTREGION",
      };

      const mockNode2 = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: "TEST2", program: "PROG2" } },
          meta: TransactionMeta,
        }),
        cicsplexName: undefined as string | undefined,
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode1, mockNode2]);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealResourceInTree).toHaveBeenCalledWith(
        mockTree,
        mockTreeview,
        "TESTPROF",
        undefined,
        "TESTREGION",
        ProgramMeta,
        ["PROG1", "PROG2"]
      );
    });
  });

  describe("Error Cases", () => {
    it("should show error when no transaction is selected", async () => {
      mockFindSelectedNodes.mockReturnValue([]);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Transaction selected");
      expect(revealNodeInTree.revealResourceInTree).not.toHaveBeenCalled();
    });

    it("should handle errors from revealResourceInTree", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: "TEST", program: "TESTPROG" } },
          meta: TransactionMeta,
        }),
        regionName: "TESTREGION",
      };

      const error = new Error("Failed to reveal");
      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (revealNodeInTree.revealResourceInTree as jest.Mock).mockRejectedValue(error);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("Failed to reveal");
    });
  });
});
