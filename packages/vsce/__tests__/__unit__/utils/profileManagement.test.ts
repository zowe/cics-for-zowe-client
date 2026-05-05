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

import { CicsCmciConstants, getCICSProfileDefinition } from "@zowe/cics-for-zowe-sdk";
import { Gui, MessageSeverity, ZoweVsCodeExtension, imperative, type IApiExplorerExtender } from "@zowe/zowe-explorer-api";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import { CICSExtensionError } from "../../../src/errors/CICSExtensionError";
import * as resourceUtils from "../../../src/utils/resourceUtils";
import * as plexUtils from "../../../src/utils/plexUtils";
import { createMockProfile, createMockProfilesCache, createMockZoweAPI } from "./__mocks__/commonMocks";

jest.mock("@zowe/zowe-explorer-api");
jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/utils/resourceUtils");
jest.mock("../../../src/utils/plexUtils");

type MockZoweAPI = ReturnType<typeof ZoweVsCodeExtension.getZoweExplorerApi>;

interface MockProfilesCache {
  refresh: jest.Mock;
  getProfileInfo: jest.Mock;
}

describe("ProfileManagement", () => {
  let mockProfile: imperative.IProfileLoaded;
  let mockZoweAPI: MockZoweAPI;
  let mockProfilesCache: MockProfilesCache;

  beforeEach(() => {
    jest.clearAllMocks();

    // Use shared mock utilities for consistency
    mockProfile = createMockProfile();
    mockProfilesCache = createMockProfilesCache();
    mockZoweAPI = createMockZoweAPI(mockProfilesCache);

    (ZoweVsCodeExtension.getZoweExplorerApi as jest.Mock) = jest.fn().mockReturnValue(mockZoweAPI);
    (getCICSProfileDefinition as jest.Mock) = jest.fn().mockReturnValue({});
    (Gui.showMessage as jest.Mock) = jest.fn();
  });

  describe("apiDoesExist", () => {
    it("should return true when API exists", () => {
      expect(ProfileManagement.apiDoesExist()).toBe(true);
    });

    /**
     * LIMITATION: This test cannot properly verify the false case due to static class initialization.
     * ProfileManagement uses static initialization (line 23-24 in profileManagement.ts) which happens
     * when the module is first imported. Once initialized, the static properties cannot be reset
     * between tests without reloading the entire module.
     *
     * FUTURE IMPROVEMENT: Consider refactoring ProfileManagement to use dependency injection
     * or a singleton pattern with a reset method to improve testability.
     */
    it("should return true even when mock returns null (static initialization limitation)", () => {
      (ZoweVsCodeExtension.getZoweExplorerApi as jest.Mock) = jest.fn().mockReturnValue(null);
      // This will still return true because the static property was already initialized
      expect(ProfileManagement.apiDoesExist()).toBe(true);
    });
  });

  describe("registerCICSProfiles", () => {
    it("should call initForZowe with correct parameters", async () => {
      const mockInitForZowe = jest.fn().mockResolvedValue(undefined);
      
      // Access the private static property and mock it
      const mockAPI = {
        getExplorerExtenderApi: jest.fn().mockReturnValue({
          initForZowe: mockInitForZowe,
          getProfilesCache: jest.fn().mockReturnValue(mockProfilesCache),
        }),
      };
      
      // Override the private static property
      Object.defineProperty(ProfileManagement, 'zoweExplorerAPI', {
        value: mockAPI,
        writable: true,
        configurable: true,
      });
      
      await ProfileManagement.registerCICSProfiles();

      expect(mockInitForZowe).toHaveBeenCalled();
      expect(mockInitForZowe).toHaveBeenCalledWith("cics", expect.any(Array));
    });
  });

  describe("getExplorerApis", () => {
    it("should return Zowe Explorer API", () => {
      const result = ProfileManagement.getExplorerApis();
      expect(result).toBeDefined();
      expect(result.getExplorerExtenderApi).toBeDefined();
    });
  });

  describe("getProfilesCache", () => {
    it("should return profiles cache", () => {
      const result = ProfileManagement.getProfilesCache();
      expect(result).toBeDefined();
      expect(result.refresh).toBeDefined();
      expect(result.getProfileInfo).toBeDefined();
    });
  });

  describe("profilesCacheRefresh", () => {
    it("should refresh profiles cache", async () => {
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      const mockCache = {
        refresh: mockRefresh,
        getProfileInfo: jest.fn().mockResolvedValue({}),
      };
      
      // Spy on getProfilesCache to return our mock cache
      // @ts-expect-error - Partial mock for testing, only includes methods used in this test
      const getProfilesCacheSpy = jest.spyOn(ProfileManagement, 'getProfilesCache').mockReturnValue(mockCache);
      
      // Spy on getExplorerApis to return mockZoweAPI
      const getExplorerApisSpy = jest.spyOn(ProfileManagement, 'getExplorerApis').mockReturnValue(mockZoweAPI);
      
      await ProfileManagement.profilesCacheRefresh();

      expect(mockRefresh).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalledWith(mockZoweAPI);
      
      getProfilesCacheSpy.mockRestore();
      getExplorerApisSpy.mockRestore();
    });
  });

  describe("getConfigInstance", () => {
    it("should return profile info", async () => {
      const mockProfileInfo = { getAllProfiles: jest.fn(), getTeamConfig: jest.fn() };
      const mockGetProfileInfo = jest.fn().mockResolvedValue(mockProfileInfo);
      const mockCache = {
        refresh: jest.fn().mockResolvedValue(undefined),
        getProfileInfo: mockGetProfileInfo,
      };
      
      const mockExtenderApi = {
        initForZowe: jest.fn().mockResolvedValue(undefined),
        getProfilesCache: jest.fn().mockReturnValue(mockCache),
      };
      
      (ZoweVsCodeExtension.getZoweExplorerApi as jest.Mock).mockReturnValue({
        getExplorerExtenderApi: jest.fn().mockReturnValue(mockExtenderApi),
      });

      const result = await ProfileManagement.getConfigInstance();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('getAllProfiles');
      expect(result).toHaveProperty('getTeamConfig');
    });
  });

  describe("formatRestClientError", () => {
    it("should format error with errorCode", () => {
      const error = {
        errorCode: "ERR001",
        additionalDetails: "Test error details",
      } as imperative.RestClientError;

      const result = ProfileManagement.formatRestClientError(error);

      expect(result).toBe("ERR001 - Test error details");
    });

    it("should format error with causeErrors code", () => {
      const error = {
        causeErrors: {
          code: "ECONNREFUSED",
          message: "Connection refused",
        },
      } as imperative.RestClientError;

      const result = ProfileManagement.formatRestClientError(error);

      expect(result).toBe("ECONNREFUSED - Connection refused");
    });

    it("should format error with only causeErrors message", () => {
      const error = {
        causeErrors: {
          message: "Connection refused",
        },
      } as imperative.RestClientError;

      const result = ProfileManagement.formatRestClientError(error);

      expect(result).toBe("Connection refused");
    });

    it("should format error with only additionalDetails", () => {
      const error = {
        additionalDetails: "Additional error info",
      } as imperative.RestClientError;

      const result = ProfileManagement.formatRestClientError(error);

      expect(result).toBe("Additional error info");
    });
  });

  describe("regionIsGroup", () => {
    it("should return true when region is a group", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            recordcount: "1",
          },
        },
      });

      const result = await ProfileManagement.regionIsGroup(mockProfile);

      expect(result).toBe(true);
      expect(resourceUtils.runGetResource).toHaveBeenCalledWith(
        expect.objectContaining({
          profileName: "testProfile",
          resourceName: CicsCmciConstants.CICS_CMCI_REGION_GROUP,
          regionName: "TESTREGION",
          cicsPlex: "TESTPLEX",
        })
      );
    });

    it("should return false when region is not a group", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            recordcount: "0",
          },
        },
      });

      const result = await ProfileManagement.regionIsGroup(mockProfile);

      expect(result).toBe(false);
    });

    it("should throw CICSExtensionError on CicsCmciRestError", async () => {
      const mockError = {
        RESPONSE_1_ALT: "ERROR",
        RESPONSE_2_ALT: "DETAILS",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.regionIsGroup(mockProfile)).rejects.toThrow(CICSExtensionError);
    });

    it("should throw CICSExtensionError on ImperativeError", async () => {
      const mockError = new imperative.ImperativeError({
        msg: "Test error",
        errorCode: "ERR001",
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.regionIsGroup(mockProfile)).rejects.toThrow(CICSExtensionError);
    });

    it("should throw CICSExtensionError on generic error", async () => {
      const mockError = new Error("Generic error");

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.regionIsGroup(mockProfile)).rejects.toThrow(CICSExtensionError);
    });
  });

  describe("isPlex", () => {
    it("should return cache token when response is OK", async () => {
      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: `${CicsCmciConstants.RESPONSE_1_CODES.OK}`,
            cachetoken: "test-cache-token",
          },
        },
      });

      const result = await ProfileManagement.isPlex(mockProfile);

      expect(result).toBe("test-cache-token");
    });

    it("should return null when response is not OK", async () => {
      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: "1026",
            cachetoken: "test-cache-token",
          },
        },
      });

      const result = await ProfileManagement.isPlex(mockProfile);

      expect(result).toBeNull();
    });

    it("should return null when 404 error occurs", async () => {
      const mockError = new CICSExtensionError({
        baseError: new Error("Not found"),
        profileName: "testProfile",
        statusCode: 404,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      const result = await ProfileManagement.isPlex(mockProfile);

      expect(result).toBeNull();
    });

    it("should throw error for non-404 errors", async () => {
      const mockError = new Error("Server error");

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.isPlex(mockProfile)).rejects.toThrow(CICSExtensionError);
    });
  });

  describe("regionPlexProvided", () => {
    it("should return info when region and plex are found", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({
          response: {
            records: {
              cicsmanagedregion: [{ name: "TESTREGION" }],
            },
          },
        })
        .mockResolvedValueOnce({
          response: {
            resultsummary: { recordcount: "0" },
          },
        });

      const result = await ProfileManagement.regionPlexProvided(mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].plexname).toBe("TESTPLEX");
      expect(result[0].regions).toHaveLength(1);
      expect(result[0].group).toBe(false);
    });

    it("should show error message when region not found in plex", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {},
        },
      });

      const result = await ProfileManagement.regionPlexProvided(mockProfile);

      expect(Gui.showMessage).toHaveBeenCalledWith(
        expect.stringContaining("Cannot find region"),
        { severity: MessageSeverity.ERROR }
      );
      expect(result).toEqual([]);
    });

    it("should handle INVALIDPARM error", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
      };

      const mockError = new CICSExtensionError({
        baseError: new Error("Invalid param"),
        profileName: "testProfile",
        resp1Code: CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.regionPlexProvided(mockProfile)).rejects.toThrow(CICSExtensionError);
    });

    it("should handle INVALIDDATA error", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
      };

      const mockError = new CICSExtensionError({
        baseError: new Error("Invalid data"),
        profileName: "testProfile",
        resp1Code: CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.regionPlexProvided(mockProfile)).rejects.toThrow(CICSExtensionError);
    });
  });

  describe("plexProvided", () => {
    it("should return info when plex is found", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        cicsPlex: "TESTPLEX",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {
            cicsmanagedregion: [{ name: "REGION1" }, { name: "REGION2" }],
          },
        },
      });

      const result = await ProfileManagement.plexProvided(mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].plexname).toBe("TESTPLEX");
      expect(result[0].regions).toHaveLength(2);
      expect(result[0].group).toBe(false);
    });

    it("should show error message when plex not found", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        cicsPlex: "TESTPLEX",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {},
        },
      });

      const result = await ProfileManagement.plexProvided(mockProfile);

      expect(Gui.showMessage).toHaveBeenCalledWith(
        expect.stringContaining("Cannot find plex"),
        { severity: MessageSeverity.ERROR }
      );
      expect(result).toEqual([]);
    });

    it("should handle INVALIDPARM error in plexProvided", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        cicsPlex: "TESTPLEX",
      };

      const mockError = new CICSExtensionError({
        baseError: new Error("Invalid param"),
        profileName: "testProfile",
        resp1Code: CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.plexProvided(mockProfile)).rejects.toThrow(CICSExtensionError);
    });

    it("should handle INVALIDDATA error in plexProvided", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        cicsPlex: "TESTPLEX",
      };

      const mockError = new CICSExtensionError({
        baseError: new Error("Invalid data"),
        profileName: "testProfile",
        resp1Code: CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.plexProvided(mockProfile)).rejects.toThrow(CICSExtensionError);
    });
  });

  describe("regionProvided", () => {
    it("should return info when region is found", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {
            cicsregion: [{ name: "TESTREGION" }],
          },
        },
      });

      const result = await ProfileManagement.regionProvided(mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].plexname).toBeNull();
      expect(result[0].regions).toHaveLength(1);
      expect(result[0].group).toBe(false);
    });

    it("should show error message when region not found", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {},
        },
      });

      const result = await ProfileManagement.regionProvided(mockProfile);

      expect(Gui.showMessage).toHaveBeenCalledWith(
        expect.stringContaining("Cannot find region"),
        { severity: MessageSeverity.ERROR }
      );
      expect(result).toEqual([]);
    });

    it("should handle INVALIDPARM error in regionProvided", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
      };

      const mockError = new CICSExtensionError({
        baseError: new Error("Invalid param"),
        profileName: "testProfile",
        resp1Code: CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.regionProvided(mockProfile)).rejects.toThrow(CICSExtensionError);
    });

    it("should handle INVALIDDATA error in regionProvided", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
      };

      const mockError = new CICSExtensionError({
        baseError: new Error("Invalid data"),
        profileName: "testProfile",
        resp1Code: CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.regionProvided(mockProfile)).rejects.toThrow(CICSExtensionError);
    });
  });

  describe("noneProvided", () => {
    it("should return plex info when isPlex returns cache token", async () => {
      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: `${CicsCmciConstants.RESPONSE_1_CODES.OK}`,
            cachetoken: "test-token",
          },
        },
      });

      (resourceUtils.runGetCache as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {
            cicscicsplex: [{ name: "PLEX1" }, { name: "PLEX2" }],
          },
        },
      });

      (plexUtils.getBestCICSplexes as jest.Mock) = jest.fn().mockReturnValue(
        new Map([
          ["PLEX1", {}],
          ["PLEX2", {}],
        ])
      );

      const result = await ProfileManagement.noneProvided(mockProfile);

      expect(result).toHaveLength(2);
      expect(result[0].plexname).toBe("PLEX1");
      expect(result[1].plexname).toBe("PLEX2");
    });

    it("should return region info when not a plex", async () => {
      (resourceUtils.runGetResource as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({
          response: {
            resultsummary: {
              api_response1: "1026",
            },
          },
        })
        .mockResolvedValueOnce({
          response: {
            records: {
              cicsregion: [{ name: "REGION1" }],
            },
          },
        });

      const result = await ProfileManagement.noneProvided(mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].plexname).toBeNull();
      expect(result[0].regions).toHaveLength(1);
    });

    it("should throw error when cache retrieval fails", async () => {
      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: `${CicsCmciConstants.RESPONSE_1_CODES.OK}`,
            cachetoken: "test-token",
          },
        },
      });

      (resourceUtils.runGetCache as jest.Mock) = jest.fn().mockRejectedValue(new Error("Cache error"));

      await expect(ProfileManagement.noneProvided(mockProfile)).rejects.toThrow(CICSExtensionError);
    });
  });

  describe("getPlexInfo", () => {
    it("should call regionPlexProvided when both cicsPlex and regionName are provided", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        cicsPlex: "TESTPLEX",
        regionName: "TESTREGION",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({
          response: {
            records: {
              cicsmanagedregion: [{ name: "TESTREGION" }],
            },
          },
        })
        .mockResolvedValueOnce({
          response: {
            resultsummary: { recordcount: "0" },
          },
        });

      const result = await ProfileManagement.getPlexInfo(mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].plexname).toBe("TESTPLEX");
    });

    it("should call plexProvided when only cicsPlex is provided", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        cicsPlex: "TESTPLEX",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {
            cicsmanagedregion: [{ name: "REGION1" }],
          },
        },
      });

      const result = await ProfileManagement.getPlexInfo(mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].plexname).toBe("TESTPLEX");
    });

    it("should call regionProvided when only regionName is provided", async () => {
      mockProfile.profile = {
        ...mockProfile.profile,
        regionName: "TESTREGION",
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          records: {
            cicsregion: [{ name: "TESTREGION" }],
          },
        },
      });

      const result = await ProfileManagement.getPlexInfo(mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].plexname).toBeNull();
    });

    it("should call noneProvided when neither cicsPlex nor regionName is provided", async () => {
      (resourceUtils.runGetResource as jest.Mock) = jest.fn()
        .mockResolvedValueOnce({
          response: {
            resultsummary: {
              api_response1: "1026",
            },
          },
        })
        .mockResolvedValueOnce({
          response: {
            records: {
              cicsregion: [{ name: "REGION1" }],
            },
          },
        });

      const result = await ProfileManagement.getPlexInfo(mockProfile);

      expect(result).toHaveLength(1);
    });
  });

  describe("getRegionInfo", () => {
    it("should return regions when found", async () => {
      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: `${CicsCmciConstants.RESPONSE_1_CODES.OK}`,
          },
          records: {
            cicsmanagedregion: [{ name: "REGION1" }, { name: "REGION2" }],
          },
        },
      });

      const result = await ProfileManagement.getRegionInfo("TESTPLEX", mockProfile);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("REGION1");
      expect(result[1].name).toBe("REGION2");
    });

    it("should return empty array when NOTAVAILABLE error occurs", async () => {
      const mockError = new CICSExtensionError({
        baseError: new Error("Not available"),
        profileName: "testProfile",
        resp1Code: CicsCmciConstants.RESPONSE_1_CODES.NOTAVAILABLE,
      });

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      const result = await ProfileManagement.getRegionInfo("TESTPLEX", mockProfile);

      expect(result).toEqual([]);
    });

    it("should throw error for other errors", async () => {
      const mockError = new Error("Server error");

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockRejectedValue(mockError);

      await expect(ProfileManagement.getRegionInfo("TESTPLEX", mockProfile)).rejects.toThrow(CICSExtensionError);
    });
  });

  describe("getRegionInfoInPlex", () => {
    it("should call getRegionInfo with plex name and profile", async () => {
      const mockPlex = {
        getPlexName: jest.fn().mockReturnValue("TESTPLEX"),
        getProfile: jest.fn().mockReturnValue(mockProfile),
      };

      (resourceUtils.runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: `${CicsCmciConstants.RESPONSE_1_CODES.OK}`,
          },
          records: {
            cicsmanagedregion: [{ name: "REGION1" }],
          },
        },
      });

      // @ts-expect-error - Partial mock for testing, only includes methods used in this test
      const result = await ProfileManagement.getRegionInfoInPlex(mockPlex);

      expect(mockPlex.getPlexName).toHaveBeenCalled();
      expect(mockPlex.getProfile).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});

// 
