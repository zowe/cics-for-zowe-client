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
import * as commandUtils from "../../../src/utils/commandUtils";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";
import { LibraryMeta, ProgramMeta } from "../../../src/doc";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/commands/revealNodeInTree");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/utils/workspaceUtils");

describe("showLibrary command", () => {
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

    showLibraryCommand(mockTree, mockTreeview);
    commandCallback = mockRegisterCommand.mock.calls[0][1];
  });

  describe("Settings Check", () => {
    it("should return early if Library resources are hidden", async () => {
      (workspaceUtils.openSettingsForHiddenResourceType as jest.Mock).mockReturnValue(false);

      await commandCallback(null);

      expect(workspaceUtils.openSettingsForHiddenResourceType).toHaveBeenCalled();
      expect(mockFindSelectedNodes).not.toHaveBeenCalled();
    });
  });

  describe("Valid Program with Library", () => {
    it("should extract library and reveal in tree", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "TESTPROG", library: "TESTLIB", librarydsn: "TESTLIBDS" } },
          meta: ProgramMeta,
        }),
        cicsplexName: "TESTPLEX",
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (revealNodeInTree.revealChildResourcesInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealChildResourcesInTree).toHaveBeenCalledWith(
        mockTree,
        mockTreeview,
        "TESTPROF",
        "TESTPLEX",
        "TESTREGION",
        LibraryMeta,
        ["TESTLIB"],
        expect.any(Map)
      );
    });

    it("should handle program without CICSplex", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "TESTPROG", library: "TESTLIB", librarydsn: "TESTLIBDS" } },
          meta: ProgramMeta,
        }),
        cicsplexName: undefined as string | undefined,
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (revealNodeInTree.revealChildResourcesInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealChildResourcesInTree).toHaveBeenCalledWith(
        mockTree,
        mockTreeview,
        "TESTPROF",
        undefined,
        "TESTREGION",
        LibraryMeta,
        ["TESTLIB"],
        expect.any(Map)
      );
    });

    it("should handle multiple programs with different libraries", async () => {
      const mockNode1 = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "PROG1", library: "LIB1", librarydsn: "LIBDS1" } },
          meta: ProgramMeta,
        }),
        cicsplexName: undefined as string | undefined,
        regionName: "TESTREGION",
      };

      const mockNode2 = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "PROG2", library: "LIB2", librarydsn: "LIBDS2" } },
          meta: ProgramMeta,
        }),
        cicsplexName: undefined as string | undefined,
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode1, mockNode2]);
      (revealNodeInTree.revealChildResourcesInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealChildResourcesInTree).toHaveBeenCalledWith(
        mockTree,
        mockTreeview,
        "TESTPROF",
        undefined,
        "TESTREGION",
        LibraryMeta,
        ["LIB1", "LIB2"],
        expect.any(Map)
      );
    });

    it("should deduplicate library names", async () => {
      const mockNode1 = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "PROG1", library: "TESTLIB", librarydsn: "TESTLIBDS" } },
          meta: ProgramMeta,
        }),
        regionName: "TESTREGION",
      };

      const mockNode2 = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "PROG2", library: "TESTLIB", librarydsn: "TESTLIBDS" } },
          meta: ProgramMeta,
        }),
        regionName: "TESTREGION",
      };

      mockFindSelectedNodes.mockReturnValue([mockNode1, mockNode2]);
      (revealNodeInTree.revealChildResourcesInTree as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(revealNodeInTree.revealChildResourcesInTree).toHaveBeenCalledWith(
        mockTree,
        mockTreeview,
        "TESTPROF",
        undefined,
        "TESTREGION",
        LibraryMeta,
        ["TESTLIB"],
        expect.any(Map)
      );
    });
  });

  describe("Error Cases", () => {
    it("should show error when no program is selected", async () => {
      mockFindSelectedNodes.mockReturnValue([]);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Program selected");
      expect(revealNodeInTree.revealChildResourcesInTree).not.toHaveBeenCalled();
    });

    it("should handle errors from revealChildResourcesInTree", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue({ name: "TESTPROF" }),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { program: "TESTPROG", library: "TESTLIB", librarydsn: "TESTLIBDS" } },
          meta: ProgramMeta,
        }),
        regionName: "TESTREGION",
      };

      const error = new Error("Failed to reveal");
      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (revealNodeInTree.revealChildResourcesInTree as jest.Mock).mockRejectedValue(error);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("Failed to reveal");
    });
  });
});
