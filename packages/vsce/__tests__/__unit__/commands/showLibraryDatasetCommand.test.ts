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
import { showLibraryDatasetCommand } from "../../../src/commands/showLibraryDatasetCommand";
import { SessionHandler } from "../../../src/resources/SessionHandler";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import * as commandUtils from "../../../src/utils/commandUtils";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/resources/SessionHandler");
jest.mock("../../../src/utils/CICSLogger");

describe("showLibraryDatasetCommand", () => {
  let mockTreeview: any;
  let commandCallback: (node: any) => Promise<void>;
  const mockRegisterCommand = commands.registerCommand as jest.Mock;
  const mockShowErrorMessage = window.showErrorMessage as jest.Mock;
  const mockFindSelectedNodes = commandUtils.findSelectedNodes as jest.Mock;
  const mockFindProfileAndShowDataSet = commandUtils.findProfileAndShowDataSet as jest.Mock;
  const mockGetInstance = SessionHandler.getInstance as jest.Mock;
  const mockDebug = CICSLogger.debug as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTreeview = {
      selection: [],
    };

    showLibraryDatasetCommand(mockTreeview);
    commandCallback = mockRegisterCommand.mock.calls[0][1];
  });

  describe("Valid Library Dataset", () => {
    it("should extract dataset name and show in Zowe Explorer", async () => {
      const mockProfile = { name: "TESTPROF" };
      const mockNode = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { dsname: "TEST.DATASET.NAME" } },
        }),
        regionName: "TESTREGION",
      };

      const mockSessionHandler = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
      };

      mockGetInstance.mockReturnValue(mockSessionHandler);
      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (commandUtils.findProfileAndShowDataSet as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(mockDebug).toHaveBeenCalledWith("Showing dataset TEST.DATASET.NAME for library dataset in region TESTREGION");
      expect(mockSessionHandler.getProfile).toHaveBeenCalledWith("TESTPROF");
      expect(commandUtils.findProfileAndShowDataSet).toHaveBeenCalledWith(mockProfile, "TEST.DATASET.NAME", "TESTREGION");
    });
  });

  describe("Error Cases", () => {
    it("should show error when no library dataset is selected", async () => {
      mockFindSelectedNodes.mockReturnValue([]);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Library Dataset selected");
      expect(mockFindProfileAndShowDataSet).not.toHaveBeenCalled();
    });

    it("should handle errors from findProfileAndShowDataSet", async () => {
      const mockProfile = { name: "TESTPROF" };
      const mockNode = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { dsname: "ERROR.DATASET" } },
        }),
        regionName: "TESTREGION",
      };

      const mockSessionHandler = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
      };

      const error = new Error("Failed to show dataset");
      mockGetInstance.mockReturnValue(mockSessionHandler);
      mockFindSelectedNodes.mockReturnValue([mockNode]);
      (commandUtils.findProfileAndShowDataSet as jest.Mock).mockRejectedValue(error);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("Failed to show dataset");
    });
  });

  describe("Multiple Node Selection", () => {
    it("should process only the first node when multiple are selected", async () => {
      const mockProfile = { name: "TESTPROF" };
      const mockNode1 = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { dsname: "FIRST.DATASET" } },
        }),
        regionName: "FIRSTREGION",
      };

      const mockNode2 = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { dsname: "SECOND.DATASET" } },
        }),
        regionName: "SECONDREGION",
      };

      const mockSessionHandler = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
      };

      mockGetInstance.mockReturnValue(mockSessionHandler);
      mockFindSelectedNodes.mockReturnValue([mockNode1, mockNode2]);
      (commandUtils.findProfileAndShowDataSet as jest.Mock).mockResolvedValue(undefined);

      await commandCallback(null);

      expect(commandUtils.findProfileAndShowDataSet).toHaveBeenCalledTimes(1);
      expect(commandUtils.findProfileAndShowDataSet).toHaveBeenCalledWith(mockProfile, "FIRST.DATASET", "FIRSTREGION");
      expect(mockNode2.getContainedResource).not.toHaveBeenCalled();
    });
  });
});
