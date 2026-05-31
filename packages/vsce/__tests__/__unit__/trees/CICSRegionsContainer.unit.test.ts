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
import { CicsCmciRestError } from "@zowe/cics-for-zowe-sdk";

jest.mock("vscode");
jest.mock("../../../src/utils/profileManagement");
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
    regionsContainer = new CICSRegionsContainer(plexTree);
    
    (window.withProgress as jest.Mock) = jest.fn().mockImplementation(async (options, callback) => {
      return callback({ report: jest.fn() }, { onCancellationRequested: jest.fn(), isCancellationRequested: false });
    });
    (window.showInformationMessage as jest.Mock) = jest.fn();
  });

  describe("Constructor", () => {
    it("should initialize with default filter when no saved filter exists", () => {
      expect(regionsContainer.activeFilter).toBe("*");
      expect(regionsContainer.label).toBe("Regions");
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.");
    });

    it("should initialize with saved filter when it exists", () => {
      jest.spyOn(PersistentStorage, "getCriteria").mockReturnValueOnce("TEST*");
      const newContainer = new CICSRegionsContainer(plexTree);
      expect(newContainer.activeFilter).toBe("TEST*");
      expect(newContainer.contextValue).toBe("cicsregionscontainer.FILTERED");
    });
  });

  describe("Test suite for filterRegions", () => {
    it("should filter regions based on the pattern", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: false });

      await regionsContainer.filterRegions("IYC*", cicsTree);

      expect(regionsContainer.activeFilter).toBe("IYC*");
      expect(regionsContainer.label).toEqual("Regions");
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.FILTERED");
      expect(PersistentStorage.setCriteria).toHaveBeenCalled();
    });

    it("should reset filter to * and clear saved criteria", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: false });

      await regionsContainer.filterRegions("*", cicsTree);

      expect(regionsContainer.activeFilter).toBe("*");
      expect(regionsContainer.contextValue).toBe("cicsregionscontainer.");
      expect(PersistentStorage.setCriteria).toHaveBeenCalledWith(expect.any(String), undefined);
    });

    it("should show information message when no regions found", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: [], hasLimitedResults: false });

      await regionsContainer.filterRegions("NOMATCH*", cicsTree);

      expect(window.showInformationMessage).toHaveBeenCalledWith(expect.stringContaining("No regions found"));
    });

    it("should expand container after filtering", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: false });

      await regionsContainer.filterRegions("cics*", cicsTree);

      expect(regionsContainer.collapsibleState).toBe(2); // TreeItemCollapsibleState.Expanded
    });

    it("should filter regions with multiple patterns separated by comma", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "CICS1", cicsstate: "ACTIVE" },
          { cicsname: "TEST1", cicsstate: "ACTIVE" },
          { cicsname: "PROD1", cicsstate: "ACTIVE" },
        ],
        hasLimitedResults: false,
      });

      await regionsContainer.filterRegions("CICS*, TEST*", cicsTree);

      expect(regionsContainer.children.length).toBe(2);
      expect(regionsContainer.children[0].getRegionName()).toBe("CICS1");
      expect(regionsContainer.children[1].getRegionName()).toBe("TEST1");
    });

    it("should show warning message when incomplete results are detected during filtering", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        hasLimitedResults: true,
        incompleteResultsMessage: "⚠️ WARNING: CMCI request returned error code 1038 (NOTPERMIT) - Response2: 1 but also returned records. Returning incomplete results."
      });
      (window.showWarningMessage as jest.Mock) = jest.fn();

      await regionsContainer.filterRegions("cics*", cicsTree);

      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code")
      );
    });

    it("should handle CICSExtensionError with CicsCmciRestError base error during filtering", async () => {
      const mockApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1031",
            api_response1_alt: "NOTPERMIT",
            api_response2: "1345",
            api_response2_alt: "USRID"
          },
          records: {},
          errors: {}
        }
      };
      const cicsCmciRestError = new CicsCmciRestError("CMCI request failed", mockApiResponse as any);
      const cicsExtensionError = new CICSExtensionError({
        baseError: cicsCmciRestError,
        profileName: "test-profile"
      });

      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(cicsExtensionError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.filterRegions("TEST*", cicsTree);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("CMCI request returned error")
      );
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should handle CICSExtensionError without CicsCmciRestError base error during filtering", async () => {
      const cicsExtensionError = new CICSExtensionError({
        baseError: new Error("Generic error"),
        profileName: "test-profile"
      });

      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(cicsExtensionError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.filterRegions("TEST*", cicsTree);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("The request on profile test-profile failed")
      );
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should handle generic error during filtering", async () => {
      const genericError = new Error("Network error");

      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(genericError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.filterRegions("TEST*", cicsTree);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Failed to filter regions")
      );
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should show warning icon when incomplete results are detected during filtering", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: true });

      await regionsContainer.filterRegions("cics*", cicsTree);

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

      await regionsContainer.loadRegionsInCICSGroup(cicsTree);

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

      await regionsContainer.loadRegionsInCICSGroup(cicsTree);

      expect(regionsContainer.children.length).toBe(1);
      expect(regionsContainer.children[0].getRegionName()).toBe("SINGLE");
    });

    it("should handle CICSExtensionError with CicsCmciRestError base error", async () => {
      const mockApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1031",
            api_response1_alt: "NOTPERMIT",
            api_response2: "1345",
            api_response2_alt: "USRID",
            api_function: ""
          },
          records: {},
          errors: {}
        }
      };
      const cicsCmciRestError = new CicsCmciRestError("CMCI request failed", mockApiResponse as any);
      
      // Create a spy on the getFormattedErrorMessage method BEFORE creating CICSExtensionError
      const getFormattedErrorMessageSpy = jest.spyOn(cicsCmciRestError, 'getFormattedErrorMessage');
      
      const cicsExtensionError = new CICSExtensionError({
        baseError: cicsCmciRestError,
        profileName: "test-profile"
      });

      getResourceMock.mockRejectedValueOnce(cicsExtensionError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInCICSGroup(cicsTree);

      expect(getFormattedErrorMessageSpy).toHaveBeenCalled();
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        "CMCI request returned error (NOTPERMIT) - USRID."
      );
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should handle CICSExtensionError without CicsCmciRestError base error", async () => {
      const cicsExtensionError = new CICSExtensionError({
        baseError: new Error("Generic error"),
        profileName: "test-profile"
      });

      getResourceMock.mockRejectedValueOnce(cicsExtensionError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInCICSGroup(cicsTree);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("The request on profile test-profile failed")
      );
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should handle generic error", async () => {
      const genericError = new TypeError("Cannot read property 'records' of undefined");

      getResourceMock.mockRejectedValueOnce(genericError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInCICSGroup(cicsTree);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Failed to load regions in CICS group:")
      );
      expect(regionsContainer.children.length).toBe(0);
    });
  });

  describe("Test suite for loadRegionsInPlex", () => {
    it("Should load all regions of plex", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: false });

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

    it("should show warning message when incomplete results are detected", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        hasLimitedResults: true,
        incompleteResultsMessage: "⚠️ WARNING: CMCI request returned error code 1038 (NOTPERMIT) - Response2: 1 but also returned records. Returning incomplete results."
      });
      (window.showWarningMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInPlex();

      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ WARNING: CMCI request returned error code")
      );
    });

    it("should show warning icon when incomplete results are detected", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: true });

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.iconPath).toEqual(expect.objectContaining({ light: expect.any(String), dark: expect.any(String) }));
    });

    it("should use fallback message when incompleteResultsMessage is not provided", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: record,
        hasLimitedResults: true
      });
      (window.showWarningMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInPlex();

      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining("Incomplete results. Some resources couldn't be retrieved.")
      );
    });

    it("should handle CICSExtensionError with CicsCmciRestError base error", async () => {
      const mockApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1031",
            api_response1_alt: "NOTPERMIT",
            api_response2: "1345",
            api_response2_alt: "USRID"
          },
          records: {},
          errors: {}
        }
      };
      const cicsCmciRestError = new CicsCmciRestError("CMCI request failed", mockApiResponse as any);
      const cicsExtensionError = new CICSExtensionError({
        baseError: cicsCmciRestError,
        profileName: "test-profile"
      });

      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(cicsExtensionError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInPlex();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("CMCI request returned error")
      );
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should handle CICSExtensionError without CicsCmciRestError base error", async () => {
      const cicsExtensionError = new CICSExtensionError({
        baseError: new Error("Generic error"),
        profileName: "test-profile"
      });

      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(cicsExtensionError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInPlex();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("The request on profile test-profile failed")
      );
      expect(regionsContainer.children.length).toBe(0);
    });

    it("should handle generic error", async () => {
      const genericError = new Error("Network error");

      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockRejectedValue(genericError);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      await regionsContainer.loadRegionsInPlex();

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Failed to load regions")
      );
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
          cicsPlex: "TESTPLEX"
        }
      } as imperative.IProfileLoaded;
      
      jest.spyOn(plexTree, 'getProfile').mockReturnValue(profileWithRegionAndPlex);
      jest.spyOn(plexTree, 'getGroupName').mockReturnValue("TESTGROUP");
      
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
      const getRegionInfoSpy = jest.spyOn(ProfileManagement, 'getRegionInfoInPlex').mockResolvedValue({ regions: record, hasLimitedResults: false });
      regionsContainer.children = [];
      // Mock the profile to not have regionName and cicsPlex to trigger loadRegionsInPlex
      jest.spyOn(plexTree, 'getProfile').mockReturnValue({
        ...profile,
        profile: { ...profile.profile, regionName: undefined, cicsPlex: undefined }
      } as imperative.IProfileLoaded);

      await regionsContainer.getChildren();

      expect(getRegionInfoSpy).toHaveBeenCalled();
    });

    it("should load regions in plex when children length is 0", async () => {
      regionsContainer.activeFilter = "TEST*";
      regionsContainer.children = [];
      const getRegionInfoSpy = jest.spyOn(ProfileManagement, 'getRegionInfoInPlex').mockResolvedValue({ regions: record, hasLimitedResults: false });
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
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: inactiveRecord, hasLimitedResults: false });

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.description).toBe("[1/2]");
    });

    it("should include filter in description when filter is active", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: false });
      regionsContainer.activeFilter = "TEST*";

      await regionsContainer.filterRegions("TEST*", cicsTree);

      expect(regionsContainer.description).toContain("region=TEST*");
    });

    it("should not include filter in description when filter is *", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({ regions: record, hasLimitedResults: false });

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
        hasLimitedResults: false,
      });

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
        hasLimitedResults: false,
      });

      await regionsContainer.filterRegions("CICS*", cicsTree);

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should match regions with wildcard at start", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "ACICS", cicsstate: "ACTIVE" },
          { cicsname: "BCICS", cicsstate: "ACTIVE" },
          { cicsname: "TEST1", cicsstate: "ACTIVE" },
        ],
        hasLimitedResults: false,
      });

      await regionsContainer.filterRegions("*CICS", cicsTree);

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should match regions with wildcard in middle", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "CICS1TEST", cicsstate: "ACTIVE" },
          { cicsname: "CICS2TEST", cicsstate: "ACTIVE" },
          { cicsname: "PROD1", cicsstate: "ACTIVE" },
        ],
        hasLimitedResults: false,
      });

      await regionsContainer.filterRegions("CICS*TEST", cicsTree);

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should handle multiple wildcards in pattern", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "ACICSB", cicsstate: "ACTIVE" },
          { cicsname: "XCICSY", cicsstate: "ACTIVE" },
          { cicsname: "TEST", cicsstate: "ACTIVE" },
        ],
        hasLimitedResults: false,
      });

      await regionsContainer.filterRegions("*CICS*", cicsTree);

      expect(regionsContainer.children.length).toBe(2);
    });

    it("should handle pattern with spaces around commas", async () => {
      (ProfileManagement.getRegionInfoInPlex as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "CICS1", cicsstate: "ACTIVE" },
          { cicsname: "TEST1", cicsstate: "ACTIVE" },
          { cicsname: "PROD1", cicsstate: "ACTIVE" },
        ],
        hasLimitedResults: false,
      });

      await regionsContainer.filterRegions("CICS* , TEST*", cicsTree);

      expect(regionsContainer.children.length).toBe(2);
    });
  });

  describe("Test suite for buildFilterStorageKey", () => {
    it("should build correct storage key", () => {
      const key = regionsContainer["buildFilterStorageKey"]();
      expect(key).toContain(profile.name);
      expect(key).toContain("MYPLEX");
      expect(key).toContain("regions-filter");
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
});
