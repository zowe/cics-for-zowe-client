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
import { CICSLogger } from "../../../src/utils/CICSLogger";
import * as commandUtils from "../../../src/utils/commandUtils";

// Mock dependencies
jest.mock("vscode");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/utils/CICSLogger");

describe("showLibraryDatasetCommand", () => {
  let mockTreeview: any;
  let commandCallback: (node: any) => Promise<void>;
  const mockRegisterCommand = commands.registerCommand as jest.Mock;
  const mockShowErrorMessage = window.showErrorMessage as jest.Mock;
  const mockFindSelectedNodes = commandUtils.findSelectedNodes as jest.Mock;
  const mockFindProfileAndShowDataSet = commandUtils.findProfileAndShowDataSet as jest.Mock;
  const mockDebug = CICSLogger.debug as jest.Mock;
  const mockError = CICSLogger.error as jest.Mock;

  // data constants
  const MOCK_PROFILE_NAME = "TESTPROF";
  const MOCK_DATASET_NAME = "TEST.DATASET.NAME";
  const MOCK_REGION_NAME = "TESTREGION";
  const MOCK_ERROR_DATASET = "ERROR.DATASET";
  const MOCK_FIRST_DATASET = "FIRST.DATASET";
  const MOCK_FIRST_REGION = "FIRSTREGION";
  const MOCK_SECOND_DATASET = "SECOND.DATASET";
  const MOCK_SECOND_REGION = "SECONDREGION";

  /**
   * Helper function to create a mock library dataset node
   */
  const createMockNode = (profileName: string, dsname: string | undefined, regionName: string) => ({
    getProfile: jest.fn().mockReturnValue({ name: profileName }),
    getContainedResource: jest.fn().mockReturnValue({
      resource: { attributes: dsname !== undefined ? { dsname } : {} },
    }),
    regionName,
  });

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
      const mockNode = createMockNode(MOCK_PROFILE_NAME, MOCK_DATASET_NAME, MOCK_REGION_NAME);

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      mockFindProfileAndShowDataSet.mockResolvedValue(undefined);

      await commandCallback(null);

      expect(mockDebug).toHaveBeenCalledWith(`Showing dataset ${MOCK_DATASET_NAME} for library dataset in region ${MOCK_REGION_NAME}`);
      expect(mockNode.getProfile).toHaveBeenCalled();
      expect(mockFindProfileAndShowDataSet).toHaveBeenCalledWith({ name: MOCK_PROFILE_NAME }, MOCK_DATASET_NAME, MOCK_REGION_NAME);
    });
  });

  describe("Error Cases", () => {
    it("should show error when no library dataset is selected", async () => {
      mockFindSelectedNodes.mockReturnValue([]);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("No CICS Library Data Set selected");
      expect(mockFindProfileAndShowDataSet).not.toHaveBeenCalled();
    });

    it("should handle errors from findProfileAndShowDataSet", async () => {
      const mockNode = createMockNode(MOCK_PROFILE_NAME, MOCK_ERROR_DATASET, MOCK_REGION_NAME);
      const error = new Error("Connection refused");

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      mockFindProfileAndShowDataSet.mockRejectedValue(error);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("Failed to show Data Set: Connection refused");
    });

    it("should log error messages and stack traces when errors occur", async () => {
      const mockNode = createMockNode(MOCK_PROFILE_NAME, MOCK_ERROR_DATASET, MOCK_REGION_NAME);
      const error = new Error("Connection refused");
      error.stack = "Error: Connection refused\n    at test.ts:1:1";

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      mockFindProfileAndShowDataSet.mockRejectedValue(error);

      await commandCallback(null);

      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to show dataset ${MOCK_ERROR_DATASET} for library dataset in region ${MOCK_REGION_NAME}: Connection refused`)
      );
    });

    it("should handle missing or null dsname attribute", async () => {
      const mockNode = createMockNode(MOCK_PROFILE_NAME, undefined, MOCK_REGION_NAME);
      const error = new Error("Cannot read property 'dsname' of undefined");

      mockFindSelectedNodes.mockReturnValue([mockNode]);
      mockFindProfileAndShowDataSet.mockRejectedValue(error);

      await commandCallback(null);

      expect(mockShowErrorMessage).toHaveBeenCalledWith("Failed to show Data Set: Cannot read property 'dsname' of undefined");
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining(`Failed to show dataset undefined for library dataset in region ${MOCK_REGION_NAME}: Cannot read property 'dsname' of undefined`)
      );
    });
  });

  describe("Multiple Node Selection", () => {
    it("should process only the first node when multiple are selected", async () => {
      const mockNode1 = createMockNode(MOCK_PROFILE_NAME, MOCK_FIRST_DATASET, MOCK_FIRST_REGION);
      const mockNode2 = createMockNode(MOCK_PROFILE_NAME, MOCK_SECOND_DATASET, MOCK_SECOND_REGION);

      mockFindSelectedNodes.mockReturnValue([mockNode1, mockNode2]);
      mockFindProfileAndShowDataSet.mockResolvedValue(undefined);

      await commandCallback(null);

      expect(mockFindProfileAndShowDataSet).toHaveBeenCalledTimes(1);
      expect(mockFindProfileAndShowDataSet).toHaveBeenCalledWith({ name: MOCK_PROFILE_NAME }, MOCK_FIRST_DATASET, MOCK_FIRST_REGION);
      expect(mockNode2.getContainedResource).not.toHaveBeenCalled();
    });
  });
});
