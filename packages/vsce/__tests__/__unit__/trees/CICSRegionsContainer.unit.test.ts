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

import { ExtensionContext, window } from "vscode";
import { MarkdownString } from "vscode";
import { CICSSessionTree } from "../../../src/trees";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import { CICSTree } from "../../../src/trees/CICSTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import { getResourceMock, profile } from "../../__mocks__";
import { imperative } from "@zowe/zowe-explorer-api";
import { CICSExtensionError } from "../../../src/errors/CICSExtensionError";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";

jest.mock("vscode");
jest.mock("../../../src/utils/profileManagement");
jest.mock("../../../src/errors/CICSErrorHandler");
jest.spyOn(PersistentStorage, "setCriteria").mockResolvedValue(undefined);
jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);

const mockContext: Partial<ExtensionContext> = {
  workspaceState: {
    get: jest.fn(),
    update: jest.fn(),
    keys: jest.fn().mockReturnValue([]),
  },
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
    keys: jest.fn().mockReturnValue([]),
    setKeysForSync: jest.fn(),
  },
};

PersistentStorage.setContext(mockContext as ExtensionContext);

const record = [
  { cicsname: "cics", cicsstate: "ACTIVE" },
  { cicsname: "test2", cicsstate: "ACTIVE" },
];

const inactiveRecord = [
  { cicsname: "cics", cicsstate: "INACTIVE" },
  { cicsname: "test2", cicsstate: "ACTIVE" },
];

describe("Test suite for CICSRegionsContainer", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;
  let plexTree: CICSPlexTree;
  let regionsContainer: CICSRegionsContainer;

  beforeEach(() => {
    jest.clearAllMocks();
    cicsTree = new CICSTree();
    sessionTree = new CICSSessionTree(profile, cicsTree);
    plexTree = new CICSPlexTree("MYPLEX", profile, sessionTree);
    jest.spyOn(plexTree, "saveRegionFilter").mockImplementation(() => {});
    regionsContainer = new CICSRegionsContainer(plexTree);
    
    (window.withProgress as jest.Mock) = jest.fn().mockImplementation(async (options, callback) => {
      return callback({ report: jest.fn() }, { onCancellationRequested: jest.fn(), isCancellationRequested: false });
    });
    (window.showInformationMessage as jest.Mock) = jest.fn();
  });

  describe("Constructor", () => {
    it("should initialize with default filter when no saved filter exists", () => {
      expect(regionsContainer.activeFilter).toBe("MYREG");
      expect(regionsContainer.label).toBe("Regions");
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.FILTERED");
    });

    it("should initialize with saved filter when it exists", () => {
      const newContainer = new CICSRegionsContainer(plexTree, "TEST*");
      expect(newContainer.activeFilter).toBe("TEST*");
      expect(newContainer.contextValue).toBe("cicsregionscontainer.FILTERED");
    });
  });

  describe("Test suite for filterRegions", () => {
    it("should filter regions based on the pattern", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, apiResponse: null });

      await regionsContainer.filterRegions("IYC*");

      expect(regionsContainer.activeFilter).toBe("IYC*");
      expect(regionsContainer.label).toEqual("Regions");
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.FILTERED");
      expect(plexTree.saveRegionFilter).toHaveBeenCalledWith("IYC*");
    });

    it("should reset filter to * and clear saved criteria", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, apiResponse: null });

      await regionsContainer.filterRegions("*");

      expect(regionsContainer.activeFilter).toBe("*");
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.");
      expect(plexTree.saveRegionFilter).toHaveBeenCalledWith("*");
    });

    it("should show information message when no regions found", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: [], hasIncompleteResults: false });

      await regionsContainer.filterRegions("NOMATCH*");

      expect(window.showInformationMessage).toHaveBeenCalledWith(expect.stringContaining("No regions found"));
    });

    it("should expand container after filtering", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasIncompleteResults: false });

      await regionsContainer.filterRegions("cics*");

      expect(regionsContainer.collapsibleState).toBe(2); // TreeItemCollapsibleState.Expanded
    });

    it("should filter regions with multiple patterns separated by comma", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "CICS1", cicsstate: "ACTIVE" },
          { cicsname: "TEST1", cicsstate: "ACTIVE" },
          { cicsname: "PROD1", cicsstate: "ACTIVE" },
        ],
        hasIncompleteResults: false,
      });

      await regionsContainer.filterRegions("CICS*, TEST*");

      expect(regionsContainer.children.length).toBe(2);
      expect(regionsContainer.children[0].getRegionName()).toBe("CICS1");
      expect(regionsContainer.children[1].getRegionName()).toBe("TEST1");
    });

    it("should show warning message when incomplete results are detected during filtering", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        apiResponse: {
          response: {
            resultsummary: {
              api_response1: "1038",
              api_response2: "1",
              recordcount: "2"
            },
            records: { cicsregion: record }
          }
        }
      });
      (window.showErrorMessage as jest.Mock) = jest.fn();
      (CICSErrorHandler.formatMessageWithDocLink as jest.Mock) = jest.fn((msg) => `${msg} Please refer to the [IBM documentation](https://example.com) for additional details`);
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn((apiResponse) => {
        if (apiResponse && 'response' in apiResponse) {
          const { resultsummary, records } = apiResponse.response;
          const isNotOk = resultsummary?.api_response1 !== "0";
          const hasRecords = records && Object.keys(records).length > 0;
          
          if (isNotOk && hasRecords && resultsummary) {
            const message = `⚠️ WARNING: CMCI request returned error code ${resultsummary.api_response1} (NOTPERMIT) - Response2: ${resultsummary.api_response2} but also returned records. Returning incomplete results.`;
            const formattedMessage = CICSErrorHandler.formatMessageWithDocLink(message, "get");
            window.showErrorMessage(formattedMessage);
            return true;
          }
        }
        return false;
      });

      await regionsContainer.filterRegions("cics*");

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code")
      );
    });

    it("should handle error during filtering using centralized error handler", async () => {
      const genericError = new Error("Network error");

      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(genericError);
      (CICSErrorHandler.handleCMCIRestError as jest.Mock) = jest.fn();

      await regionsContainer.filterRegions("TEST*");

      expect(CICSErrorHandler.handleCMCIRestError).toHaveBeenCalledWith(
        expect.any(CICSExtensionError)
      );
      const callArg = (CICSErrorHandler.handleCMCIRestError as jest.Mock).mock.calls[0][0];
      expect(callArg.cicsExtensionError.baseError).toBe(genericError);
      expect(callArg.cicsExtensionError.profileName).toBe("MYPROF");
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should show warning icon when incomplete results are detected during filtering", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        apiResponse: { incompleteResults: true }
      });

      await regionsContainer.filterRegions("cics*");

      expect(regionsContainer.iconPath).toEqual(expect.objectContaining({ light: expect.any(String), dark: expect.any(String) }));
    });
  });

  describe("Test suite for loadRegionsInCICSGroup", () => {
    it("should load regions in CICS group", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: record },
        },
      });

      regionsContainer.activeFilter = "cics";

      await regionsContainer.loadRegionsInCICSGroup();

      expect(regionsContainer.label).toBe("Regions");
      expect(regionsContainer.description).toBe("region=cics [1/1]");
      expect(regionsContainer.collapsibleState).toBe(2);
    });

    it("should handle single region response", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: { cicsname: "SINGLE", cicsstate: "ACTIVE" } },
        },
      });

      regionsContainer.activeFilter = "*";
      await regionsContainer.loadRegionsInCICSGroup();

      expect(regionsContainer.children.length).toBe(1);
      expect(regionsContainer.children[0].getRegionName()).toBe("SINGLE");
    });

    it("should handle error using centralized error handler in loadRegionsInCICSGroup", async () => {
      const genericError = new Error("Network error");

      getResourceMock.mockRejectedValueOnce(genericError);
      (CICSErrorHandler.handleCMCIRestError as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInCICSGroup();

      expect(CICSErrorHandler.handleCMCIRestError).toHaveBeenCalledWith(
        expect.any(CICSExtensionError)
      );
      const callArg = (CICSErrorHandler.handleCMCIRestError as jest.Mock).mock.calls[0][0];
      expect(callArg.cicsExtensionError.profileName).toBe("MYPROF");
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should rethrow non-CICSExtensionError errors from loadRegionsInCICSGroup", async () => {
      const nonCICSError = new Error("Unexpected error");
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: record },
        },
      });
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn(() => {
        throw nonCICSError;
      });

      await expect(regionsContainer.loadRegionsInCICSGroup()).rejects.toThrow("Unexpected error");
    });

    it("should show warning message when incomplete results are detected in loadRegionsInCICSGroup", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1038", api_response2: "1", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: record },
        }
      });
      (window.showErrorMessage as jest.Mock) = jest.fn();
      (CICSErrorHandler.formatMessageWithDocLink as jest.Mock) = jest.fn((msg) => `${msg} Please refer to the [IBM documentation](https://example.com) for additional details`);
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn((apiResponse) => {
        if (apiResponse && 'response' in apiResponse) {
          const { resultsummary, records } = apiResponse.response;
          const isNotOk = resultsummary?.api_response1 !== "0";
          const hasRecords = records && Object.keys(records).length > 0;
          
          if (isNotOk && hasRecords && resultsummary) {
            const message = `⚠️ WARNING: CMCI request returned error code ${resultsummary.api_response1} (NOTPERMIT) - Response2: ${resultsummary.api_response2} but also returned records. Returning incomplete results.`;
            const formattedMessage = CICSErrorHandler.formatMessageWithDocLink(message, "get");
            window.showErrorMessage(formattedMessage);
            return true;
          }
        }
        return false;
      });

      await regionsContainer.loadRegionsInCICSGroup();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code")
      );
      expect(CICSErrorHandler.formatMessageWithDocLink).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code 1038"),
        "get"
      );
    });

    it("should use fallback message when incompleteResultsMessage is not provided in loadRegionsInCICSGroup", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: record },
        }
      });
      (window.showErrorMessage as jest.Mock) = jest.fn();
      (CICSErrorHandler.formatMessageWithDocLink as jest.Mock) = jest.fn((msg) => {
        return msg === undefined ? "undefined Please refer to the [IBM documentation](https://example.com) for additional details" : `${msg} Please refer to the [IBM documentation](https://example.com) for additional details`;
      });
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn((apiResponse) => {
        if (apiResponse && 'response' in apiResponse) {
          const { resultsummary, records } = apiResponse.response;
          const isNotOk = resultsummary?.api_response1 !== "0";
          const hasRecords = records && Object.keys(records).length > 0;
          
          if (isNotOk && hasRecords && resultsummary) {
            const message = `⚠️ WARNING: CMCI request returned error code ${resultsummary.api_response1} - Response2: ${resultsummary.api_response2} but also returned records. Returning incomplete results.`;
            const formattedMessage = CICSErrorHandler.formatMessageWithDocLink(message, "get");
            window.showErrorMessage(formattedMessage);
            return true;
          }
        }
        return false;
      });

      await regionsContainer.loadRegionsInCICSGroup();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code")
      );
      expect(CICSErrorHandler.formatMessageWithDocLink).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code 1024"),
        "get"
      );
    });
  });

  describe("Test suite for loadRegionsInPlex", () => {
    it("Should load all regions of plex", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasIncompleteResults: false });

      regionsContainer.activeFilter = "*";
      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.label).toBe("Regions");
      expect(regionsContainer.description).toBe("[2/2]");
      expect(regionsContainer.collapsibleState).toBe(2);
    });

    it("should handle null regionInfo", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue(null);

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.children.length).toBe(0);
    });

    it("should handle undefined regionInfo", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.children.length).toBe(0);
    });

    it("should do nothing when regionInfo is truthy but regions is falsy", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: undefined,
        apiResponse: null,
      });

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.children.length).toBe(0);
      expect(regionsContainer.collapsibleState).not.toBe(2);
    });

    it("should show warning message when incomplete results are detected", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        apiResponse: {
          response: {
            resultsummary: {
              api_response1: "1038",
              api_response2: "1",
              recordcount: "2"
            },
            records: { cicsregion: record }
          }
        }
      });
      (window.showErrorMessage as jest.Mock) = jest.fn();
      (CICSErrorHandler.formatMessageWithDocLink as jest.Mock) = jest.fn((msg) => `${msg} Please refer to the [IBM documentation](https://example.com) for additional details`);
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn((apiResponse) => {
        if (apiResponse && 'response' in apiResponse) {
          const { resultsummary, records } = apiResponse.response;
          const isNotOk = resultsummary?.api_response1 !== "0";
          const hasRecords = records && Object.keys(records).length > 0;
          
          if (isNotOk && hasRecords && resultsummary) {
            const message = `⚠️ WARNING: CMCI request returned error code ${resultsummary.api_response1} (NOTPERMIT) - Response2: ${resultsummary.api_response2} but also returned records. Returning incomplete results.`;
            const formattedMessage = CICSErrorHandler.formatMessageWithDocLink(message, "get");
            window.showErrorMessage(formattedMessage);
            return true;
          }
        }
        return false;
      });

      await regionsContainer.loadRegionsInPlex();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code")
      );
    });

    it("should show warning icon when incomplete results are detected", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        apiResponse: {
          response: {
            resultsummary: {
              api_response1: "1038",
              recordcount: "2"
            },
            records: { cicsregion: record }
          }
        }
      });

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.iconPath).toEqual(expect.objectContaining({ light: expect.any(String), dark: expect.any(String) }));
    });

    it("should use fallback message when incompleteResultsMessage is not provided", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        apiResponse: {
          response: {
            resultsummary: {
              api_response1: "1024",
              api_response2: "0",
              recordcount: "2"
            },
            records: { cicsregion: record }
          }
        }
      });
      (window.showErrorMessage as jest.Mock) = jest.fn();
      (CICSErrorHandler.formatMessageWithDocLink as jest.Mock) = jest.fn((msg) => {
        return msg === undefined ? "undefined Please refer to the [IBM documentation](https://example.com) for additional details" : `${msg} Please refer to the [IBM documentation](https://example.com) for additional details`;
      });
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn((apiResponse) => {
        if (apiResponse && 'response' in apiResponse) {
          const { resultsummary, records } = apiResponse.response;
          const isNotOk = resultsummary?.api_response1 !== "0";
          const hasRecords = records && Object.keys(records).length > 0;
          
          if (isNotOk && hasRecords && resultsummary) {
            const message = `⚠️ WARNING: CMCI request returned error code ${resultsummary.api_response1} - Response2: ${resultsummary.api_response2} but also returned records. Returning incomplete results.`;
            const formattedMessage = CICSErrorHandler.formatMessageWithDocLink(message, "get");
            window.showErrorMessage(formattedMessage);
            return true;
          }
        }
        return false;
      });

      await regionsContainer.loadRegionsInPlex();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code")
      );
    });

    it("should handle error using centralized error handler", async () => {
      const mockError = new Error("Test error");
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(mockError);
      (window.showErrorMessage as jest.Mock) = jest.fn();
      (CICSErrorHandler.handleCMCIRestError as jest.Mock) = jest.fn((error) => {
        const msg = error.cicsExtensionError.errorMessage;
        const formattedMessage = CICSErrorHandler.formatMessageWithDocLink(msg, "get");
        return window.showErrorMessage(formattedMessage);
      });
      (CICSErrorHandler.formatMessageWithDocLink as jest.Mock) = jest.fn((msg) => `${msg} Please refer to the [IBM documentation](https://example.com) for additional details`);

      await regionsContainer.loadRegionsInPlex();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Please refer to the [IBM documentation]")
      );
      expect(CICSErrorHandler.formatMessageWithDocLink).toHaveBeenCalled();
      expect(regionsContainer.children.length).toBe(0);
    });
  });

  describe("Test suite for getChildren", () => {
    it("should return children when requireDescriptionUpdate is true", async () => {
      regionsContainer["requireDescriptionUpdate"] = true;
      const mockRegionTree = { getRegionName: () => "TEST" } as Partial<CICSRegionTree> as CICSRegionTree;
      regionsContainer.children = [mockRegionTree];

      const children = await regionsContainer.getChildren();

      expect(children.length).toBe(1);
      expect(regionsContainer["requireDescriptionUpdate"]).toBe(false);
    });

    it("should load regions in CICS group when profile has regionName and cicsPlex and groupName", async () => {
      // Mock profile with regionName and cicsPlex
      const profileWithRegionAndPlex = {
        ...profile,
        profile: {
          ...profile.profile,
          regionName: "TESTREGION",
          cicsPlex: "TESTPLEX",
        },
      } as imperative.IProfileLoaded;

      jest.spyOn(plexTree, "getProfile").mockReturnValue(profileWithRegionAndPlex);
      jest.spyOn(plexTree, "getGroupName").mockReturnValue("TESTGROUP");

      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: record },
        },
      });

      const children = await regionsContainer.getChildren();

      expect(children).toBeDefined();
      expect(getResourceMock).toHaveBeenCalled();
    });

    it("should load regions in plex when activeFilter is * and no children", async () => {
      const getRegionInfoSpy = jest.spyOn(ProfileManagement, 'getRegionInfoInPlex').mockResolvedValue({ regions: record, apiResponse: null });
      regionsContainer.children = [];
      jest.spyOn(plexTree, 'getProfile').mockReturnValue({
        ...profile,
        profile: { ...profile.profile, regionName: undefined, cicsPlex: undefined }
      } as imperative.IProfileLoaded);

      await regionsContainer.getChildren();

      expect(getRegionInfoSpy).toHaveBeenCalled();
    });

    it("should load regions in plex when profile has regionName and cicsPlex but no groupName and shouldLoadRegions is true", async () => {
      const profileWithRegionAndPlex = {
        ...profile,
        profile: {
          ...profile.profile,
          regionName: "TESTREGION",
          cicsPlex: "TESTPLEX",
        },
      } as imperative.IProfileLoaded;

      jest.spyOn(plexTree, "getProfile").mockReturnValue(profileWithRegionAndPlex);
      jest.spyOn(plexTree, "getGroupName").mockReturnValue(undefined);

      const getRegionInfoSpy = jest.spyOn(ProfileManagement, "getRegionInfoInPlex").mockResolvedValue({ regions: record, apiResponse: null });
      regionsContainer.children = [];
      regionsContainer.activeFilter = "TEST*";

      await regionsContainer.getChildren();

      expect(getRegionInfoSpy).toHaveBeenCalled();
    });

    it("should load regions in plex when children length is 0", async () => {
      regionsContainer.activeFilter = "TEST*";
      regionsContainer.children = [];
      const getRegionInfoSpy = jest.spyOn(ProfileManagement, 'getRegionInfoInPlex').mockResolvedValue({ regions: record, apiResponse: null });
      // Mock the profile to not have regionName and cicsPlex to trigger loadRegionsInPlex
      jest.spyOn(plexTree, 'getProfile').mockReturnValue({
        ...profile,
        profile: { ...profile.profile, regionName: undefined, cicsPlex: undefined }
      } as imperative.IProfileLoaded);

      await regionsContainer.getChildren();

      expect(getRegionInfoSpy).toHaveBeenCalled();
    });
  });

  describe("Test suite for updateDescription", () => {
    it("should count active and total regions correctly", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: inactiveRecord, hasIncompleteResults: false });

      regionsContainer.activeFilter = "*";
      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.description).toBe("[1/2]");
    });

    it("should include filter in description when filter is active", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasIncompleteResults: false });
      regionsContainer.activeFilter = "TEST*";

      await regionsContainer.filterRegions("TEST*");

      expect(regionsContainer.description).toContain("region=TEST*");
    });

    it("should not include filter in description when filter is *", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasIncompleteResults: false });

      regionsContainer.activeFilter = "*";
      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.description).not.toContain("region=");
      expect(regionsContainer.description).toBe("[2/2]");
    });

    it("should handle regions with null cicsstate", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "cics", cicsstate: null },
          { cicsname: "test2", cicsstate: "ACTIVE" },
        ],
        hasIncompleteResults: false,
      });

      regionsContainer.activeFilter = "*";
      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.description).toBe("[1/2]");
    });
  });

  describe("Test suite for refreshIcon", () => {
    it("should refresh icon with folder open", () => {
      regionsContainer.refreshIcon(true);
      expect(regionsContainer.iconPath).toBeDefined();
    });

    it("should refresh icon with folder closed", () => {
      regionsContainer.refreshIcon(false);
      expect(regionsContainer.iconPath).toBeDefined();
    });

    it("should refresh icon with default parameter", () => {
      regionsContainer.refreshIcon();
      expect(regionsContainer.iconPath).toBeDefined();
    });
  });

  describe("Test suite for utility methods", () => {
    it("should set label", () => {
      regionsContainer.setLabel("New Label");
      expect(regionsContainer.label).toBe("New Label");
    });

    it("should get parent", () => {
      const parent = regionsContainer.getParent();
      expect(parent).toBe(plexTree);
    });

    it("should clear children", () => {
      const mockRegionTree = { getRegionName: () => "TEST" } as Partial<CICSRegionTree> as CICSRegionTree;
      regionsContainer.children = [mockRegionTree];
      regionsContainer.clearChildren();
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should get session", () => {
      const session = regionsContainer.getSession();
      expect(session).toBeDefined();
    });
  });

  describe("Test suite for pattern matching", () => {
    it("should match regions with wildcard at end", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "CICS1", cicsstate: "ACTIVE" },
          { cicsname: "CICS2", cicsstate: "ACTIVE" },
          { cicsname: "TEST1", cicsstate: "ACTIVE" },
        ],
        hasIncompleteResults: false,
      });

      await regionsContainer.filterRegions("CICS*");

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should match regions with wildcard at start", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "ACICS", cicsstate: "ACTIVE" },
          { cicsname: "BCICS", cicsstate: "ACTIVE" },
          { cicsname: "TEST1", cicsstate: "ACTIVE" },
        ],
        hasIncompleteResults: false,
      });

      await regionsContainer.filterRegions("*CICS");

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should match regions with wildcard in middle", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "CICS1TEST", cicsstate: "ACTIVE" },
          { cicsname: "CICS2TEST", cicsstate: "ACTIVE" },
          { cicsname: "PROD1", cicsstate: "ACTIVE" },
        ],
        hasIncompleteResults: false,
      });

      await regionsContainer.filterRegions("CICS*TEST");

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should handle multiple wildcards in pattern", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "ACICSB", cicsstate: "ACTIVE" },
          { cicsname: "XCICSY", cicsstate: "ACTIVE" },
          { cicsname: "TEST", cicsstate: "ACTIVE" },
        ],
        hasIncompleteResults: false,
      });

      await regionsContainer.filterRegions("*CICS*");

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should handle pattern with spaces around commas", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "CICS1", cicsstate: "ACTIVE" },
          { cicsname: "TEST1", cicsstate: "ACTIVE" },
          { cicsname: "PROD1", cicsstate: "ACTIVE" },
        ],
        hasIncompleteResults: false,
      });

      await regionsContainer.filterRegions("CICS* , TEST*");

      expect(regionsContainer.children.length).toBe(2);
    });
  });

  describe("Test suite for updateLabelAndContext", () => {
    it("should update context value when filter is active", () => {
      regionsContainer.activeFilter = "TEST*";
      regionsContainer["updateLabelAndContext"]();
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.FILTERED");
    });

    it("should update context value when filter is *", () => {
      regionsContainer.activeFilter = "*";
      regionsContainer["updateLabelAndContext"]();
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.");
    });
  });

  describe("Test suite for incomplete results tooltip", () => {
    const notpermitApiResponse = {
      response: {
        resultsummary: {
          api_response1: "1031",
          api_response2: "1345",
          api_response1_alt: "NOTPERMIT",
          api_response2_alt: "USRID",
          recordcount: "5",
        },
        records: { cicsmanagedregion: record },
      },
    };

    it("should set NOTPERMIT tooltip when filterRegions returns partial-auth response", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        apiResponse: notpermitApiResponse,
      });
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn().mockReturnValue(true);
      (CICSErrorHandler.buildIncompleteResultsTooltip as jest.Mock) = jest.fn().mockReturnValue(
        Object.assign(new MarkdownString(), { value: "Retrieving these resources resulted in an error:\n\n**NOTPERMIT (1031) / USRID (1345)**\n\nVisit [IBM docs](https://example.com) for resp code details" })
      );

      await regionsContainer.filterRegions("*");

      expect(regionsContainer.tooltip).toBeInstanceOf(MarkdownString);
      const tooltipValue = (regionsContainer.tooltip as MarkdownString).value;
      expect(tooltipValue).toContain("NOTPERMIT");
      expect(tooltipValue).toContain("1031");
      expect(String(regionsContainer.description)).toContain("ⓘ");
    });

    it("should clear tooltip on clean filterRegions (no error)", async () => {
      regionsContainer.tooltip = new MarkdownString("old tooltip");
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, apiResponse: null });
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn().mockReturnValue(false);

      await regionsContainer.filterRegions("*");

      expect(regionsContainer.tooltip).toBeUndefined();
      expect(String(regionsContainer.description)).not.toContain("ⓘ");
    });

    it("should set NOTPERMIT tooltip when loadRegionsInPlex returns partial-auth response", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        apiResponse: notpermitApiResponse,
      });
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn().mockReturnValue(true);
      (CICSErrorHandler.buildIncompleteResultsTooltip as jest.Mock) = jest.fn().mockReturnValue(
        Object.assign(new MarkdownString(), { value: "Retrieving these resources resulted in an error:\n\n**NOTPERMIT (1031) / USRID (1345)**" })
      );

      regionsContainer.activeFilter = "*";
      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.tooltip).toBeInstanceOf(MarkdownString);
    });

    it("should clear tooltip on clean loadRegionsInPlex (no error)", async () => {
      regionsContainer.tooltip = new MarkdownString("old tooltip");
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, apiResponse: null });
      (CICSErrorHandler.handleErrorIfPresent as jest.Mock) = jest.fn().mockReturnValue(false);

      regionsContainer.activeFilter = "*";
      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.tooltip).toBeUndefined();
    });

    it("should clear tooltip (no popup) when filterRegions throws a fatal error", async () => {
      const networkError = new Error("Network error");
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(networkError);

      await regionsContainer.filterRegions("TEST*");

      expect(regionsContainer.tooltip).toBeUndefined();
    });

    it("should clear tooltip when loadRegionsInPlex throws a fatal error", async () => {
      const networkError = new Error("Network error");
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(networkError);

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.tooltip).toBeUndefined();
    });
  });

});
