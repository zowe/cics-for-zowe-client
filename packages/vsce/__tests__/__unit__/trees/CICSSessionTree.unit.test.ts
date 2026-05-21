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

import { l10n, type MessageItem } from "vscode";
import type { ProfileInfo } from "@zowe/imperative";
import constants from "../../../src/constants/CICS.defaults";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";
import { CICSExtensionError } from "../../../src/errors/CICSExtensionError";
import { CICSTree } from "../../../src/trees";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import * as iconUtils from "../../../src/utils/iconUtils";
import { ProfileManagement, type InfoLoaded } from "../../../src/utils/profileManagement";
import * as profileUtils from "../../../src/utils/profileUtils";
import { profile } from "../../__mocks__";

jest.spyOn(CICSExtensionError.prototype, "parseError").mockImplementation(function (this: CICSExtensionError) {
  this.cicsExtensionError.errorMessage = this.cicsExtensionError.errorMessage || "error";
});

const getProfileInfoSpy = jest.spyOn(ProfileManagement, "getPlexInfo");
jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);
const iconSpy = jest.spyOn(iconUtils, "getIconFilePathFromName");
const handleCMCIRestErrorSpy = jest.spyOn(CICSErrorHandler, "handleCMCIRestError");
const mockRestClientError = Object.assign(new Error("Unauthorized"), {
  mDetails: {
    errorCode: "401",
    resource: "https://example.com/api",
    msg: "Unauthorized",
  },
  errorCode: "401",
});

// Create a mock unauthorized error using the mocked constructor
const unauthorizedError = new CICSExtensionError({
  baseError: mockRestClientError,
  statusCode: constants.HTTP_ERROR_UNAUTHORIZED,
  errorMessage: "Invalid user or session expired",
  profileName: "thisProfile",
});

describe("Test suite for CICSSessionTree", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;

  beforeEach(() => {
    cicsTree = new CICSTree();
    sessionTree = new CICSSessionTree(profile, cicsTree);
    sessionTree.isUnauthorized = true;
    expect(iconSpy).toHaveBeenCalledWith("profile-unverified");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Test suite for getChildren", () => {
    const updatedProfile = { ...profile, name: "updated-profile" };

    it("should return an array of childrens", async () => {
      getProfileInfoSpy.mockResolvedValueOnce([
        { plexname: "MYPLEX1", regions: [], group: false },
        { plexname: "MYPLEX2", regions: [], group: false },
      ]);
      expect((await sessionTree.getChildren()).length).toEqual(2);
    });

    it("should handle unauthorized exception and set isUnauthorized to true", async () => {
      getProfileInfoSpy.mockRejectedValueOnce(unauthorizedError);

      // Mock the error handler to prevent actual UI interaction
      handleCMCIRestErrorSpy.mockResolvedValueOnce("");

      const children = await sessionTree.getChildren();

      expect(sessionTree.getIsUnauthorized()).toBe(true);
      expect(handleCMCIRestErrorSpy).toHaveBeenCalledWith(unauthorizedError, expect.any(Array));
      expect(children).toEqual([]);
      expect(iconSpy).toHaveBeenCalledWith("profile-disconnected");
    });

    it("should handle unauthorized exception and prompt updateCredentials", async () => {
      const mockPlexInfo: InfoLoaded[] = [{ plexname: "PLEX1", regions: [{ applid: "REGION1" }], group: false }];

      getProfileInfoSpy.mockRejectedValueOnce(unauthorizedError);
      // Mock implementation: return the first action from the array (simulating user clicking it)
      // This is deterministic - we know it will return the "Update Credentials" action
      handleCMCIRestErrorSpy.mockImplementationOnce((_error, actions) => {
        return Promise.resolve(actions![0]);
      });

      const updateProfileSpy = jest.spyOn(profileUtils, "updateProfile");
      updateProfileSpy.mockResolvedValueOnce(updatedProfile);
      getProfileInfoSpy.mockResolvedValueOnce(mockPlexInfo);

      const children = await sessionTree.getChildren();

      expect(sessionTree.getIsUnauthorized()).toBe(false);
      expect(handleCMCIRestErrorSpy).toHaveBeenCalledWith(
        unauthorizedError,
        expect.arrayContaining([expect.objectContaining({ title: l10n.t("Update Credentials") })])
      );
      expect(updateProfileSpy).toHaveBeenCalledWith(profile, sessionTree);
      expect(getProfileInfoSpy).toHaveBeenCalledTimes(2);
      expect(children.length).toBeGreaterThan(0);
    });

    it("should handle retry authentication failure and notify error", async () => {
      const retryMockRestClientError = Object.assign(new Error("Unauthorized"), {
        mDetails: {
          errorCode: "401",
          resource: "https://example.com/api",
          msg: "Unauthorized",
        },
        errorCode: "401",
      });
      
      const retryUnauthorizedError = new CICSExtensionError({
        baseError: retryMockRestClientError,
        statusCode: constants.HTTP_ERROR_UNAUTHORIZED,
        errorMessage: "Invalid user or session expired",
        profileName: "thisProfile",
      });

      getProfileInfoSpy.mockRejectedValueOnce(unauthorizedError);
      // First call: return the first action (Update Credentials button)
      handleCMCIRestErrorSpy.mockImplementationOnce((_error, actions) => {
        return Promise.resolve(actions![0]);
      });
      // Second call: no actions array, return empty string
      handleCMCIRestErrorSpy.mockResolvedValueOnce("");

      const updateProfileSpy = jest.spyOn(profileUtils, "updateProfile");
      updateProfileSpy.mockResolvedValueOnce(updatedProfile);
      getProfileInfoSpy.mockRejectedValueOnce(retryUnauthorizedError);

      const children = await sessionTree.getChildren();

      expect(sessionTree.getIsUnauthorized()).toBe(true);
      expect(handleCMCIRestErrorSpy).toHaveBeenCalledTimes(2);
      expect(handleCMCIRestErrorSpy).toHaveBeenNthCalledWith(1, unauthorizedError, expect.any(Array));
      expect(handleCMCIRestErrorSpy).toHaveBeenNthCalledWith(2, retryUnauthorizedError);
      expect(retryUnauthorizedError.cicsExtensionError.errorMessage).toBe(
        "Login failed. Multiple failed attempts may lock your account. Please verify your credentials."
      );
      expect(updateProfileSpy).toHaveBeenCalledWith(profile, sessionTree);
      expect(getProfileInfoSpy).toHaveBeenCalledTimes(2);
      expect(children).toEqual([]);
    });
  });
  describe("Test suite for setUnauthorized", () => {
    it("should set isUnauthorized to true", () => {
      sessionTree.setUnauthorized();
      expect(sessionTree.isUnauthorized).toBeTruthy();
    });
  });
  describe("Test suite for setAuthorized", () => {
    it("should set isUnauthorized to false", () => {
      sessionTree.setAuthorized();
      expect(sessionTree.isUnauthorized).toBeFalsy();
    });
  });
  describe("Test suite for getIsUnauthorized", () => {
    it("should return the object of isUnauthorized", () => {
      expect(sessionTree.getIsUnauthorized()).toBeTruthy();
    });
  });

  describe("Test suite for resetAllResourceContainers", () => {
    it("should call reset on all resource containers in CICSRegionTree children", () => {
      const mockFetcher = { reset: jest.fn() };
      const mockResourceContainer = Object.create(CICSResourceContainerNode.prototype);
      mockResourceContainer.getFetcher = jest.fn().mockReturnValue(mockFetcher);

      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      mockRegionTree.children = [mockResourceContainer];

      sessionTree.children = [mockRegionTree];

      sessionTree.resetAllResourceContainers();

      expect(mockResourceContainer.getFetcher).toHaveBeenCalled();
      expect(mockFetcher.reset).toHaveBeenCalled();
    });

    it("should call reset on all resource containers in CICSPlexTree children", () => {
      const mockFetcher = { reset: jest.fn() };
      const mockResourceContainer = Object.create(CICSResourceContainerNode.prototype);
      mockResourceContainer.getFetcher = jest.fn().mockReturnValue(mockFetcher);

      const mockPlexTree = Object.create(CICSPlexTree.prototype);
      mockPlexTree.children = [mockResourceContainer];
      mockPlexTree.plexName = "TESTPLEX";

      sessionTree.children = [mockPlexTree];

      sessionTree.resetAllResourceContainers();

      expect(mockResourceContainer.getFetcher).toHaveBeenCalled();
      expect(mockFetcher.reset).toHaveBeenCalled();
    });

    it("should handle CICSRegionsContainer in CICSPlexTree children", () => {
      const mockFetcher = { reset: jest.fn() };
      const mockResourceContainer = Object.create(CICSResourceContainerNode.prototype);
      mockResourceContainer.getFetcher = jest.fn().mockReturnValue(mockFetcher);

      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      mockRegionTree.children = [mockResourceContainer];

      const mockRegionsContainer = Object.create(CICSRegionsContainer.prototype);
      mockRegionsContainer.children = [mockRegionTree];

      const mockPlexTree = Object.create(CICSPlexTree.prototype);
      mockPlexTree.children = [mockRegionsContainer];
      mockPlexTree.plexName = "TESTPLEX";

      sessionTree.children = [mockPlexTree];

      sessionTree.resetAllResourceContainers();

      expect(mockResourceContainer.getFetcher).toHaveBeenCalled();
      expect(mockFetcher.reset).toHaveBeenCalled();
    });

    it("should handle undefined or null fetcher gracefully", () => {
      const mockResourceContainer = Object.create(CICSResourceContainerNode.prototype);
      mockResourceContainer.getFetcher = jest.fn().mockReturnValue(undefined);

      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      mockRegionTree.children = [mockResourceContainer];

      sessionTree.children = [mockRegionTree];

      expect(() => sessionTree.resetAllResourceContainers()).not.toThrow();
      expect(mockResourceContainer.getFetcher).toHaveBeenCalled();
    });

    it("should handle empty children array", () => {
      sessionTree.children = [];

      expect(() => sessionTree.resetAllResourceContainers()).not.toThrow();
    });

    it("should handle null children in nodes", () => {
      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      mockRegionTree.children = null;

      sessionTree.children = [mockRegionTree];

      expect(() => sessionTree.resetAllResourceContainers()).not.toThrow();
    });
  });
  describe("Test suite for icon decorations", () => {
    it("Should change from no-entry to green tick icon when connection succeeds", () => {
      sessionTree.setUnauthorized();
      expect(iconSpy).toHaveBeenCalledWith("profile-disconnected");
      sessionTree.setAuthorized();
      expect(iconSpy).toHaveBeenCalledWith("profile");
    });
  
  describe("Test suite for reset", () => {
    it("should reset the session tree", () => {
      const mockFetcher = { reset: jest.fn() };
      const mockResourceContainer = Object.create(CICSResourceContainerNode.prototype);
      mockResourceContainer.getFetcher = jest.fn().mockReturnValue(mockFetcher);

      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      mockRegionTree.children = [mockResourceContainer];

      sessionTree.children = [mockRegionTree];
      sessionTree.isUnauthorized = false;

      sessionTree.reset();

      expect(sessionTree.children).toEqual([]);
      expect(sessionTree.isUnauthorized).toBeUndefined();
      expect(mockFetcher.reset).toHaveBeenCalled();
    });
  });

  describe("Test suite for getSession", () => {
    it("should return the session from SessionHandler", () => {
      const session = sessionTree.getSession();
      expect(session).toBeDefined();
    });
  });

  describe("Test suite for setProfile and getProfile", () => {
    it("should set and get profile", () => {
      const newProfile = { ...profile, name: "new-profile" };
      sessionTree.setProfile(newProfile);
      expect(sessionTree.getProfile()).toEqual(newProfile);
    });
  });

  describe("Test suite for getParent", () => {
    it("should return the parent CICSTree", () => {
      expect(sessionTree.getParent()).toBe(cicsTree);
    });
  });

  describe("Test suite for setIsExpanded", () => {
    it("should set collapsible state to expanded", () => {
      sessionTree.setIsExpanded(true);
      expect(sessionTree.collapsibleState).toBe(2); // TreeItemCollapsibleState.Expanded
    });

    it("should set collapsible state to collapsed", () => {
      sessionTree.setIsExpanded(false);
      expect(sessionTree.collapsibleState).toBe(1); // TreeItemCollapsibleState.Collapsed
    });
  });

  describe("Test suite for getRegionNodeFromName", () => {
    it("should find region node without cicsplex", () => {
      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      mockRegionTree.getRegionName = jest.fn().mockReturnValue("REGION1");

      sessionTree.children = [mockRegionTree];

      const result = sessionTree.getRegionNodeFromName("REGION1");
      expect(result).toBe(mockRegionTree);
    });

    it("should find region node with cicsplex", () => {
      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      mockRegionTree.getRegionName = jest.fn().mockReturnValue("REGION1");

      const mockPlexTree = Object.create(CICSPlexTree.prototype);
      mockPlexTree.plexName = "PLEX1";
      mockPlexTree.children = [mockRegionTree];
      mockPlexTree.getRegionNodeFromName = jest.fn().mockReturnValue(mockRegionTree);

      sessionTree.children = [mockPlexTree];

      const result = sessionTree.getRegionNodeFromName("REGION1", "PLEX1");
      expect(result).toBe(mockRegionTree);
      expect(mockPlexTree.getRegionNodeFromName).toHaveBeenCalledWith("REGION1");
    });

    it("should return undefined when region not found", () => {
      sessionTree.children = [];
      const result = sessionTree.getRegionNodeFromName("NONEXISTENT");
      expect(result).toBeUndefined();
    });

    it("should return undefined when plex has no children", () => {
      const mockPlexTree = Object.create(CICSPlexTree.prototype);
      mockPlexTree.plexName = "PLEX1";
      mockPlexTree.children = [];

      sessionTree.children = [mockPlexTree];

      const result = sessionTree.getRegionNodeFromName("REGION1", "PLEX1");
      expect(result).toBeUndefined();
    });
  });

  describe("Test suite for getChildren edge cases", () => {
    it("should return children when requiresIconUpdate is true", async () => {
      const mockRegionTree = Object.create(CICSRegionTree.prototype);
      sessionTree.children = [mockRegionTree];
      sessionTree.requiresIconUpdate = true;

      const children = await sessionTree.getChildren();

      expect(children).toEqual([mockRegionTree]);
      expect(sessionTree.requiresIconUpdate).toBe(false);
    });

    it("should return empty array when config does not exist", async () => {
      const mockConfigInstance: Partial<ProfileInfo> = {
        getTeamConfig: jest.fn().mockReturnValue({ exists: false }),
      };
      jest.spyOn(ProfileManagement, "getConfigInstance").mockResolvedValueOnce(mockConfigInstance as ProfileInfo);

      const children = await sessionTree.getChildren();

      expect(children).toEqual([]);
    });

    it("should handle non-401 error and set unauthorized", async () => {
      const mockError = new CICSExtensionError({
        baseError: new Error("Server error"),
        statusCode: 500,
        errorMessage: "Internal server error",
        profileName: "testProfile",
      });

      getProfileInfoSpy.mockRejectedValueOnce(mockError);
      handleCMCIRestErrorSpy.mockResolvedValueOnce("");

      const children = await sessionTree.getChildren();

      expect(sessionTree.getIsUnauthorized()).toBe(true);
      expect(handleCMCIRestErrorSpy).toHaveBeenCalledWith(mockError);
      expect(children).toEqual([]);
    });

    it("should create region tree when plexname is null", async () => {
      const mockPlexInfo: InfoLoaded[] = [
        {
          plexname: null,
          regions: [{ applid: "REGION1" }],
          group: false,
        },
      ];

      getProfileInfoSpy.mockResolvedValueOnce(mockPlexInfo);

      const mockRegionData = {
        response: {
          records: {
            cicsregion: [{ applid: "REGION1" }],
          },
        },
      };

      const runGetResourceSpy = jest.spyOn(require("../../../src/utils/resourceUtils"), "runGetResource");
      runGetResourceSpy.mockResolvedValueOnce(mockRegionData);

      const children = await sessionTree.getChildren();

      expect(children.length).toBe(1);
      expect(children[0]).toBeInstanceOf(CICSRegionTree);
      expect(runGetResourceSpy).toHaveBeenCalled();
    });

    it("should set label for group plex", async () => {
      const mockPlexInfo: InfoLoaded[] = [
        {
          plexname: "PLEX1",
          regions: [],
          group: true,
        },
      ];

      const profileWithRegion = {
        ...profile,
        profile: { ...profile.profile, regionName: "REGION1" },
      };

      const sessionTreeWithRegion = new CICSSessionTree(profileWithRegion, cicsTree);
      getProfileInfoSpy.mockResolvedValueOnce(mockPlexInfo);

      const children = await sessionTreeWithRegion.getChildren();

      expect(children.length).toBe(1);
      expect(children[0]).toBeInstanceOf(CICSPlexTree);
    });

    it("should handle error during children creation and set unauthorized", async () => {
      const mockPlexInfo: InfoLoaded[] = [
        {
          plexname: null,
          regions: [{ applid: "REGION1" }],
          group: false,
        },
      ];

      getProfileInfoSpy.mockResolvedValueOnce(mockPlexInfo);

      const runGetResourceSpy = jest.spyOn(require("../../../src/utils/resourceUtils"), "runGetResource");
      runGetResourceSpy.mockRejectedValueOnce(new Error("Network error"));

      const children = await sessionTree.getChildren();

      expect(sessionTree.getIsUnauthorized()).toBe(true);
      expect(sessionTree.collapsibleState).toBe(1); 
      expect(children).toEqual([]);
    });

    it("should return empty array when updateProfile returns null", async () => {
      getProfileInfoSpy.mockRejectedValueOnce(unauthorizedError);
      // First call: return the first action (Update Credentials button)
      handleCMCIRestErrorSpy.mockImplementationOnce((_error, actions) => {
        return Promise.resolve(actions![0]);
      });
      // Second call: after retry fails
      handleCMCIRestErrorSpy.mockResolvedValueOnce("");

      const updateProfileSpy = jest.spyOn(profileUtils, "updateProfile");
      updateProfileSpy.mockResolvedValueOnce(profile);
      getProfileInfoSpy.mockRejectedValueOnce(unauthorizedError);

      const children = await sessionTree.getChildren();

      expect(children).toEqual([]);
      expect(updateProfileSpy).toHaveBeenCalled();
    });
  });
  });
});
