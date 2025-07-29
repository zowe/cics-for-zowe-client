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

const getLastUsedRegionMock = jest.fn();
const setLastUsedRegionMock = jest.fn();
const getLoadedProfilesMock = jest.fn();
const getAllProfilesMock = jest.fn();
const getPlexInfoMock = jest.fn();

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import * as vscode from "vscode";
import {
  getAllCICSProfiles,
  getChoiceFromQuickPick,
  getLastUsedRegion,
  getPlexInfoFromProfile,
  isCICSProfileValidInSettings,
  setLastUsedRegion,
} from "../../../src/utils/lastUsedRegionUtils";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("@zowe/zowe-explorer-api", () => ({
  Gui: {
    resolveQuickPick: jest.fn().mockResolvedValue({ label: "Item1" }),
    showMessage: jest.fn(),
    errorMessage: jest.fn(),
  },
}));
jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/PersistentStorage", () => ({
  PersistentStorage: jest.fn().mockImplementation(() => ({
    getLastUsedRegion: getLastUsedRegionMock,
    setLastUsedRegion: setLastUsedRegionMock,
  })),
}));
jest.mock("../../../src/trees/CICSTree", () => ({
  CICSTree: jest.fn().mockImplementation(() => ({
    getLoadedProfiles: getLoadedProfilesMock,
    refreshLoadedProfiles: jest.fn(),
  })),
}));
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: jest.fn().mockReturnValue({
      getProfileInfo: jest.fn().mockReturnValue({
        getAllProfiles: getAllProfilesMock,
      }),
    }),
    getPlexInfo: getPlexInfoMock,
  },
}));

const lastUsedRegion = {
  regionName: "IYK2ZXXX",
  cicsPlexName: "PLEXX",
  profileName: "Profile1",
};
const loadedProfiles = [globalMocks.CICSSessionTreeMock];
const mockSession: CICSSession = {
  verified: true,
  sessionId: "session1",
  getSessionId: () => "session1",
} as any;

(vscode as any).l10n = { t: jest.fn() };
const l10nMock = jest.spyOn(vscode.l10n, "t");

describe("Test suite for lastUsedRegionUtils", () => {
  describe("Test suite for getLastUsedRegion()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should return the last used region", () => {
      getLastUsedRegionMock.mockReturnValueOnce(lastUsedRegion);
      const selectedRegion = {
        regionName: "IYK2ZXXX",
        cicsPlexName: "PLEXX",
        profileName: "Profile1",
      };
      const result = getLastUsedRegion();

      expect(result).toEqual(selectedRegion);
      expect(getLastUsedRegionMock).toHaveBeenCalled();
    });
  });

  describe("Test suite for setLastUsedRegion()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    l10nMock.mockReturnValueOnce("Region selected: TESTREGION and CICSplex: TESTPLEX");
    it("should set the last used region", () => {
      const regionName = "NEWREGION";
      const profileName = "NEWPROFILE";
      const cicsPlexName = "NEWPLEX";

      setLastUsedRegion(regionName, profileName, cicsPlexName);
      expect(setLastUsedRegionMock).toHaveBeenCalledWith({ regionName, cicsPlexName, profileName });
    });

    it("should not set the region if region name is empty string", () => {
      setLastUsedRegion("", "PROFILE");
      expect(setLastUsedRegionMock).not.toHaveBeenCalled();
    });

    it("should not set the region if profile name is empty string", () => {
      setLastUsedRegion("REGION", "");
      expect(setLastUsedRegionMock).not.toHaveBeenCalled();
    });
  });

  describe("Test suite for getAllCICSProfiles()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should return profiles loaded in the CICS tree", async () => {
      getLoadedProfilesMock.mockReturnValueOnce(loadedProfiles);
      const result = await getAllCICSProfiles();
      expect(result).toEqual(["Profile1"]);

      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(getAllProfilesMock).not.toHaveBeenCalled();
    });

    it("should return profiles from the profile cache if no profiles are loaded in the CICS tree", async () => {
      getLoadedProfilesMock.mockReturnValueOnce([]);
      getAllProfilesMock.mockReturnValueOnce([{ profName: "Profile1" }, { profName: "Profile2" }]);
      const result = await getAllCICSProfiles();

      expect(result).toEqual(["Profile1", "Profile2"]);
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(getAllProfilesMock).toHaveBeenCalledWith("cics");
    });

    it("should return empty profiles if no CICS profiles exists", async () => {
      getLoadedProfilesMock.mockReturnValueOnce([]);
      getAllProfilesMock.mockReturnValueOnce([]);
      const result = await getAllCICSProfiles();

      expect(result.length).toBe(0);
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(getAllProfilesMock).toHaveBeenCalledWith("cics");
    });
  });

  describe("Test suite for isCICSProfileValidInSettings()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return true if profile name and region name is present", async () => {
      getLoadedProfilesMock.mockReturnValueOnce(loadedProfiles);
      getLastUsedRegionMock.mockReturnValueOnce(lastUsedRegion);
      const result = await isCICSProfileValidInSettings();

      expect(getLastUsedRegionMock).toHaveBeenCalled();
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if profile name is not present", async () => {
      getLoadedProfilesMock.mockReturnValueOnce(loadedProfiles);
      getLastUsedRegionMock.mockReturnValueOnce({ regionName: "IYK2XXX", cicsPlexName: "PLEX", profileName: "" });
      const result = await isCICSProfileValidInSettings();

      expect(getLastUsedRegionMock).toHaveBeenCalled();
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should return false if profile name is not in the list of profiles", async () => {
      getLoadedProfilesMock.mockReturnValueOnce(loadedProfiles);
      getLastUsedRegionMock.mockReturnValue({ regionName: "IYK2XXX", profileName: "Profile2" });
      const result = await isCICSProfileValidInSettings();

      expect(getLastUsedRegionMock).toHaveBeenCalled();
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("Test suite for getPlexInfoFromProfile()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return plex info from profile", async () => {
      const mockPlexInfo = { plexName: "PLEX1" };
      getPlexInfoMock.mockResolvedValueOnce(mockPlexInfo);
      const result = await getPlexInfoFromProfile(globalMocks.profile, mockSession);

      expect(result).toEqual(mockPlexInfo);
      expect(getPlexInfoMock).toHaveBeenCalledWith(globalMocks.profile, mockSession);
    });

    it("should handle error while fetching plex info and return null", async () => {
      const errorMessage = "Error fetching plex info";
      getPlexInfoMock.mockRejectedValue(new Error(errorMessage));
      const result = await getPlexInfoFromProfile(globalMocks.profile, mockSession);

      expect(result).toBeNull();
      expect(getPlexInfoMock).toHaveBeenCalledWith(globalMocks.profile, mockSession);
    });
  });

  describe("Test suite for getChoiceFromQuickPick()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return selected item from quick pick", async () => {
      const items = [{ label: "Item1" }, { label: "Item2" }];
      const placeHolder = "Select an item";
      const quickPick = {
        busy: false,
        ignoreFocusOut: true,
        placeHolder: placeHolder,
        show: () => jest.fn(),
      } as any;
      const result = await getChoiceFromQuickPick(quickPick, placeHolder, items);

      expect(result).toEqual(items[0]);
      expect(quickPick.items).toEqual(items);
    });
  });
});
