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

import { Gui } from "@zowe/zowe-explorer-api";
import { ConfigurationTarget } from "vscode";
import {
  getAllCICSProfiles,
  getChoiceFromQuickPick,
  getLastUsedRegion,
  getPlexInfoFromProfile,
  isCICSProfileValidInSettings,
  setLastUsedRegion,
} from "../../../src/utils/lastUsedRegionUtils";
import { InfoLoaded, ProfileManagement } from "../../../src/utils/profileManagement";
import { getAllProfilesMock, profile, workspaceConfigurationGetMock, workspaceConfigurationUpdateMock } from "../../__mocks__";

const lastUsedRegion = {
  regionName: "MYREGION",
  cicsPlexName: "MYPLEX",
  profileName: "MYPROFILE",
};

const getPlexInfoSpy = jest.spyOn(ProfileManagement, "getPlexInfo");
jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce({ label: "Item1" });

workspaceConfigurationGetMock.mockReturnValue(lastUsedRegion);

describe("Test suite for lastUsedRegionUtils", () => {
  describe("Test suite for getLastUsedRegion()", () => {
    it("should return the last used region", () => {
      const result = getLastUsedRegion();

      expect(result).toEqual(lastUsedRegion);
      expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Test suite for setLastUsedRegion()", () => {
    beforeEach(() => {
      workspaceConfigurationGetMock.mockReset();
      workspaceConfigurationUpdateMock.mockReset();
    });

    it("should set the last used region", () => {
      const regionName = "NEWREGION";
      const profileName = "NEWPROFILE";
      const cicsPlexName = "NEWPLEX";

      setLastUsedRegion(regionName, profileName, cicsPlexName);
      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledTimes(1);
      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
        "zowe.cics.persistent",
        expect.objectContaining({ lastUsedRegion: { regionName, cicsPlexName, profileName } }),
        ConfigurationTarget.Global
      );
    });

    it("should not set the region if region name is empty string", () => {
      setLastUsedRegion("", "PROFILE");
      expect(workspaceConfigurationUpdateMock).not.toHaveBeenCalled();
    });

    it("should not set the region if profile name is empty string", () => {
      setLastUsedRegion("REGION", "");
      expect(workspaceConfigurationUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe("Test suite for getAllCICSProfiles()", () => {
    beforeEach(() => {
      workspaceConfigurationGetMock.mockReset();
      workspaceConfigurationUpdateMock.mockReset();
    });
    it("should return profiles loaded in the CICS tree", async () => {
      workspaceConfigurationGetMock.mockReturnValue(["Profile1"]);
      const result = await getAllCICSProfiles();
      expect(result).toEqual(["Profile1"]);

      expect(workspaceConfigurationGetMock).toHaveBeenCalled();
      expect(getAllProfilesMock).not.toHaveBeenCalled();
    });

    it("should return profiles from the profile cache if no profiles are loaded in the CICS tree", async () => {
      workspaceConfigurationGetMock.mockReturnValueOnce([]);
      getAllProfilesMock.mockReturnValueOnce([{ profName: "Profile1" }, { profName: "Profile2" }]);
      const result = await getAllCICSProfiles();

      expect(result).toEqual(["Profile1", "Profile2"]);
      expect(workspaceConfigurationGetMock).toHaveBeenCalled();
      expect(getAllProfilesMock).toHaveBeenCalledWith("cics");
    });

    it("should return empty profiles if no CICS profiles exists", async () => {
      workspaceConfigurationGetMock.mockReturnValueOnce([]);
      const result = await getAllCICSProfiles();

      expect(result.length).toBe(0);
      expect(workspaceConfigurationGetMock).toHaveBeenCalled();
      expect(getAllProfilesMock).toHaveBeenCalledWith("cics");
    });
  });

  describe("Test suite for isCICSProfileValidInSettings()", () => {
    beforeEach(() => {
      workspaceConfigurationGetMock.mockReset();
      workspaceConfigurationUpdateMock.mockReset();
    });

    it("should return true if profile name and region name is present", async () => {
      workspaceConfigurationGetMock.mockReturnValueOnce(lastUsedRegion);
      workspaceConfigurationGetMock.mockReturnValueOnce(["MYPROFILE"]);
      const result = await isCICSProfileValidInSettings();

      expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(2);
      expect(result).toBe(true);
    });

    it("should return false if profile name is not present", async () => {
      workspaceConfigurationGetMock.mockReturnValueOnce({ ...lastUsedRegion, profileName: "" });
      workspaceConfigurationGetMock.mockReturnValueOnce(["Profile1"]);
      const result = await isCICSProfileValidInSettings();

      expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(2);
      expect(result).toBe(false);
    });

    it("should return false if profile name is not in the list of profiles", async () => {
      workspaceConfigurationGetMock.mockReturnValueOnce(lastUsedRegion);
      workspaceConfigurationGetMock.mockReturnValueOnce(["Profile1"]);
      const result = await isCICSProfileValidInSettings();

      expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(2);
      expect(result).toBe(false);
    });
  });

  describe("Test suite for getPlexInfoFromProfile()", () => {
    it("should return plex info from profile", async () => {
      const mockPlexInfo: InfoLoaded[] = [
        { plexname: "MYPLEX1", regions: [], group: false },
        { plexname: "MYPLEX2", regions: [], group: false },
      ];
      getPlexInfoSpy.mockResolvedValueOnce(mockPlexInfo);
      const result = await getPlexInfoFromProfile(profile);

      expect(result).toEqual(mockPlexInfo);
      expect(getPlexInfoSpy).toHaveBeenCalledWith(profile);
    });

    it("should handle error while fetching plex info and return null", async () => {
      const errorMessage = "Error fetching plex info";
      getPlexInfoSpy.mockRejectedValue(new Error(errorMessage));
      const result = await getPlexInfoFromProfile(profile);

      expect(result).toBeNull();
      expect(getPlexInfoSpy).toHaveBeenCalledWith(profile);
    });
  });

  describe("Test suite for getChoiceFromQuickPick()", () => {
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
