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

const getAllProfilesMock = jest.fn();
const getPlexInfoMock = jest.fn();

import * as vscode from "vscode";
import {
  getAllCICSProfiles,
  getChoiceFromQuickPick,
  getLastUsedRegion,
  getPlexInfoFromProfile,
  isCICSProfileValidInSettings,
  setLastUsedRegion,
} from "../../../src/utils/lastUsedRegionUtils";

jest.mock("@zowe/zowe-explorer-api", () => ({
  Gui: {
    resolveQuickPick: jest.fn().mockResolvedValue({ label: "Item1" }),
    showMessage: jest.fn(),
    errorMessage: jest.fn(),
  },
}));
jest.mock("../../../src/utils/CICSLogger");

import PersistentStorage from "../../../src/utils/PersistentStorage";
import { InfoLoaded } from "../../../src/utils/profileManagement";

const getLastUsedRegionSpy = jest.spyOn(PersistentStorage, "getLastUsedRegion");
const setLastUsedRegionSpy = jest.spyOn(PersistentStorage, "setLastUsedRegion");
const getLoadedProfilesMock = jest.spyOn(PersistentStorage, "getLoadedCICSProfiles");
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

const cicsProfile = {
  message: "",
  type: "cics",
  failNotFound: false,
  name: "MYPROF",
  profile: {},
};
const lastUsedRegion = {
  regionName: "MYREGION",
  cicsPlexName: "MYPLEX",
  profileName: "MYPROFILE",
};

(vscode as any).l10n = { t: jest.fn() };
const l10nMock = jest.spyOn(vscode.l10n, "t");

describe("Test suite for lastUsedRegionUtils", () => {
  describe("Test suite for getLastUsedRegion()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should return the last used region", () => {
      getLastUsedRegionSpy.mockReturnValueOnce(lastUsedRegion);
      const result = getLastUsedRegion();

      expect(result).toEqual(lastUsedRegion);
      expect(getLastUsedRegionSpy).toHaveBeenCalledTimes(1);
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
      expect(setLastUsedRegionSpy).toHaveBeenCalledWith({ regionName, cicsPlexName, profileName });
    });

    it("should not set the region if region name is empty string", () => {
      setLastUsedRegion("", "PROFILE");
      expect(setLastUsedRegionSpy).not.toHaveBeenCalled();
    });

    it("should not set the region if profile name is empty string", () => {
      setLastUsedRegion("REGION", "");
      expect(setLastUsedRegionSpy).not.toHaveBeenCalled();
    });
  });

  describe("Test suite for getAllCICSProfiles()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it("should return profiles loaded in the CICS tree", async () => {
      getLoadedProfilesMock.mockReturnValue(["Profile1"]);
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
      getLoadedProfilesMock.mockReturnValueOnce(["MYPROFILE"]);
      getLastUsedRegionSpy.mockReturnValueOnce(lastUsedRegion);
      const result = await isCICSProfileValidInSettings();

      expect(getLastUsedRegionSpy).toHaveBeenCalled();
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if profile name is not present", async () => {
      getLoadedProfilesMock.mockReturnValueOnce(["Profile1"]);
      getLastUsedRegionSpy.mockReturnValueOnce({ ...lastUsedRegion, profileName: "" });
      const result = await isCICSProfileValidInSettings();

      expect(getLastUsedRegionSpy).toHaveBeenCalled();
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("should return false if profile name is not in the list of profiles", async () => {
      getLoadedProfilesMock.mockReturnValueOnce(["Profile1"]);
      getLastUsedRegionSpy.mockReturnValueOnce(lastUsedRegion);
      const result = await isCICSProfileValidInSettings();

      expect(getLastUsedRegionSpy).toHaveBeenCalled();
      expect(getLoadedProfilesMock).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("Test suite for getPlexInfoFromProfile()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return plex info from profile", async () => {
      const mockPlexInfo: InfoLoaded[] = [
        { plexname: "MYPLEX1", regions: [], group: false },
        { plexname: "MYPLEX2", regions: [], group: false },
      ];
      getPlexInfoMock.mockResolvedValueOnce(mockPlexInfo);
      const result = await getPlexInfoFromProfile(cicsProfile);

      expect(result).toEqual(mockPlexInfo);
      expect(getPlexInfoMock).toHaveBeenCalledWith(cicsProfile);
    });

    it("should handle error while fetching plex info and return null", async () => {
      const errorMessage = "Error fetching plex info";
      getPlexInfoMock.mockRejectedValue(new Error(errorMessage));
      const result = await getPlexInfoFromProfile(cicsProfile);

      expect(result).toBeNull();
      expect(getPlexInfoMock).toHaveBeenCalledWith(cicsProfile);
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
