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
import { getInquireTransactionCommand } from "../../../src/commands/inquireTransaction";
import * as revealNodeInTree from "../../../src/commands/revealNodeInTree";
import * as commandUtils from "../../../src/utils/commandUtils";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";
import { TransactionMeta } from "../../../src/doc";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/commands/revealNodeInTree");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/utils/workspaceUtils");

describe("inquireTransaction command", () => {
  let mockTree: any;
  let mockTreeview: any;
  let commandCallback: (node: any) => Promise<void>;
  const mockRegisterCommand = commands.registerCommand as jest.Mock;
  const mockShowErrorMessage = window.showErrorMessage as jest.Mock;
  const mockFindSelectedNodes = commandUtils.findSelectedNodes as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTree = {
      getLoadedProfiles: jest.fn().mockReturnValue([]),
      refresh: jest.fn(),
    };

    mockTreeview = {
      selection: [],
      reveal: jest.fn().mockResolvedValue(undefined),
    };

    (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(true);

    getInquireTransactionCommand(mockTree, mockTreeview);
    commandCallback = mockRegisterCommand.mock.calls[0][1];
  });

  describe("Settings Check", () => {
    it("should return early if Transaction resources are hidden", async () => {
      (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(false);

      await commandCallback(null);

      expect(workspaceUtils.openSettingsForHiddenResourceType).toHaveBeenCalled();
      expect(mockFindSelectedNodes).not.toHaveBeenCalled();
    });
  });

  describe("Valid Task with Transaction", () => {
    it("should extract transaction and reveal in tree", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: "TEST1", task: "12345" } },
          meta: { resourceName: CicsCmciConstants.CICS_CMCI_TASK },
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
        TransactionMeta,
        ["TEST1"]
      );
    });

    it("should handle task without CICSplex", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: "TEST1" } },
          meta: { resourceName: CicsCmciConstants.CICS_CMCI_TASK },
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
        TransactionMeta,
        ["TEST1"]
      );
    });
  });

  describe("Error Cases", () => {
    it("should show error when no task is selected", async () => {
      mockFindSelectedNodes.mockReturnValue([]);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Task selected");
      expect(revealNodeInTree.revealResourceInTree).not.toHaveBeenCalled();
    });

    it("should show error when task has no transaction", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { tranid: null } },
          meta: { resourceName: CicsCmciConstants.CICS_CMCI_TASK },
        }),
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode]);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No transaction associated with this task");
      expect(revealNodeInTree.revealResourceInTree).not.toHaveBeenCalled();
    });
  });
});
