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

import { l10n } from "vscode";
import constants from "../../../src/constants/CICS.defaults";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";
import { CICSExtensionError } from "../../../src/errors/CICSExtensionError";
import { CICSTree } from "../../../src/trees";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import * as iconUtils from "../../../src/utils/iconUtils";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import * as profileUtils from "../../../src/utils/profileUtils";
import { profile } from "../../__mocks__";

jest.spyOn(CICSExtensionError.prototype, "parseError").mockImplementation(function (this: CICSExtensionError) {
  this.cicsExtensionError.errorMessage = this.cicsExtensionError.errorMessage || "error";
});

const getProfileInfoSpy = jest.spyOn(ProfileManagement, "getPlexInfo");
jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);
const iconSpy = jest.spyOn(iconUtils, "getIconFilePathFromName");
const handleCMCIRestErrorSpy = jest.spyOn(CICSErrorHandler, "handleCMCIRestError");
const mockRestClientError = {
  mDetails: {
    errorCode: "401",
    resource: "https://example.com/api",
    msg: "Unauthorized",
  },
  errorCode: "401",
};

// Create a mock unauthorized error using the mocked constructor
const unauthorizedError = new CICSExtensionError({
  baseError: mockRestClientError,
  statusCode: constants.HTTP_ERROR_UNAUTHORIZED,
  errorMessage: "Invalid user or session expired",
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
      handleCMCIRestErrorSpy.mockResolvedValueOnce("" as any);

      const children = await sessionTree.getChildren();

      expect(sessionTree.getIsUnauthorized()).toBe(true);
      expect(handleCMCIRestErrorSpy).toHaveBeenCalledWith(unauthorizedError, expect.any(Array));
      expect(children).toEqual([]);
      expect(iconSpy).toHaveBeenCalledWith("profile-disconnected");
    });

    it("should handle unauthorized exception and prompt updateCredentials", async () => {
      const mockPlexInfo = [{ plexname: "PLEX1", regions: [{ applid: "REGION1" }] }];

      getProfileInfoSpy.mockRejectedValueOnce(unauthorizedError);
      handleCMCIRestErrorSpy.mockImplementation((error, actions) => {
        return Promise.resolve(actions?.[0] as any);
      });

      const updateProfileSpy = jest.spyOn(profileUtils, "updateProfile");
      updateProfileSpy.mockResolvedValueOnce(updatedProfile);
      getProfileInfoSpy.mockResolvedValueOnce(mockPlexInfo as any);

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
      const retryUnauthorizedError = new CICSExtensionError({
        baseError: mockRestClientError,
        statusCode: constants.HTTP_ERROR_UNAUTHORIZED,
        errorMessage: "Invalid user or session expired",
      });

      getProfileInfoSpy.mockRejectedValueOnce(unauthorizedError);
      handleCMCIRestErrorSpy.mockImplementation((error, actions) => {
        return Promise.resolve(actions?.[0] as any);
      });

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
      mockRegionTree.children = null as any;
      
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
  });
});
