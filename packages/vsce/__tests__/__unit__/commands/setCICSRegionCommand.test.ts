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

import { Gui, MessageSeverity } from "@zowe/zowe-explorer-api";
import { QuickPickItem, commands } from "vscode";
import { getLastUsedRegion, setCICSRegion, setCICSRegionCommand } from "../../../src/commands/setCICSRegionCommand";
import { SessionHandler } from "../../../src/resources";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import * as regionUtils from "../../../src/utils/lastUsedRegionUtils";
import { ProfileManagement } from "../../../src/utils/profileManagement";

jest.mock("vscode");
jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/resources");
jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/lastUsedRegionUtils");
jest.mock("../../../src/utils/profileManagement");

describe("setCICSRegionCommand", () => {
  let mockQuickPick: {
    show: jest.Mock;
    hide: jest.Mock;
    dispose: jest.Mock;
    onDidHide: jest.Mock;
    placeholder: string;
    busy: boolean;
    items: QuickPickItem[];
  };
  let mockProfile: {
    name: string;
    profile: {
      cicsPlex?: string;
      regionName?: string;
    };
  };
  let mockSession: { session: string };
  let mockProfilesCache: {
    getLoadedProfConfig: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      dispose: jest.fn(),
      onDidHide: jest.fn(),
      placeholder: "",
      busy: false,
      items: [],
    };

    mockProfile = {
      name: "testProfile",
      profile: {
        cicsPlex: undefined,
        regionName: undefined,
      },
    };

    mockSession = { session: "mockSession" };

    mockProfilesCache = {
      getLoadedProfConfig: jest.fn().mockResolvedValue(mockProfile),
    };

    (Gui.createQuickPick as jest.Mock) = jest.fn().mockReturnValue(mockQuickPick);
    (ProfileManagement.getProfilesCache as jest.Mock) = jest.fn().mockReturnValue(mockProfilesCache);
    (SessionHandler.getInstance as jest.Mock) = jest.fn().mockReturnValue({
      getSession: jest.fn().mockReturnValue(mockSession),
    });
    (CICSLogger.info as jest.Mock) = jest.fn();
    (Gui.infoMessage as jest.Mock) = jest.fn();
    (Gui.showMessage as jest.Mock) = jest.fn();
  });

  describe("setCICSRegionCommand", () => {
    it("should register the command", () => {
      const mockRegisterCommand = jest.fn();
      (commands.registerCommand as jest.Mock) = mockRegisterCommand;

      setCICSRegionCommand();

      expect(mockRegisterCommand).toHaveBeenCalledWith("cics-extension-for-zowe.setCICSRegion", expect.any(Function));
    });
  });

  describe("getLastUsedRegion", () => {
    it("should return last used region when valid", async () => {
      (regionUtils.isCICSProfileValidInSettings as jest.Mock) = jest.fn().mockResolvedValue(true);
      (regionUtils.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue({
        profileName: "testProfile",
        regionName: "testRegion",
        cicsPlexName: "testPlex",
      });
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockResolvedValue({
        label: "Region: testRegion | CICSplex : testPlex | Profile: testProfile",
        description: "Last used region",
      });

      const result = await getLastUsedRegion();

      expect(result).toBeDefined();
      expect(result?.regionName).toBe("testRegion");
      expect(result?.cicsPlexName).toBe("testPlex");
      expect(mockQuickPick.hide).toHaveBeenCalled();
    });

    it("should return last used region without plex", async () => {
      (regionUtils.isCICSProfileValidInSettings as jest.Mock) = jest.fn().mockResolvedValue(true);
      (regionUtils.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue({
        profileName: "testProfile",
        regionName: "testRegion",
        cicsPlexName: undefined,
      });
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockResolvedValue({
        label: "Region: testRegion | Profile: testProfile",
        description: "Last used region",
      });

      const result = await getLastUsedRegion();

      expect(result).toBeDefined();
      expect(result?.regionName).toBe("testRegion");
      expect(result?.cicsPlexName).toBeUndefined();
    });

    it("should call setCICSRegion when 'Other' is selected", async () => {
      (regionUtils.isCICSProfileValidInSettings as jest.Mock) = jest.fn().mockResolvedValue(true);
      (regionUtils.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue({
        profileName: "testProfile",
        regionName: "testRegion",
        cicsPlexName: "testPlex",
      });
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockResolvedValue({
        label: "Other CICS Region",
      });
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue([]);

      await getLastUsedRegion();

      expect(Gui.infoMessage).toHaveBeenCalled();
    });

    it("should return undefined when no choice is made", async () => {
      (regionUtils.isCICSProfileValidInSettings as jest.Mock) = jest.fn().mockResolvedValue(true);
      (regionUtils.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue({
        profileName: "testProfile",
        regionName: "testRegion",
        cicsPlexName: "testPlex",
      });
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await getLastUsedRegion();

      expect(result).toBeUndefined();
    });

    it("should show QuickPick with 'Other CICS Region' when profile is not valid", async () => {
      (regionUtils.isCICSProfileValidInSettings as jest.Mock) = jest.fn().mockResolvedValue(false);
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue([]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await getLastUsedRegion();

      expect(regionUtils.getChoiceFromQuickPick).toHaveBeenCalledWith(mockQuickPick, "Select Region", [{ label: "Other CICS Region" }]);
    });
  });

  describe("setCICSRegion", () => {
    it("should show info message when no profiles found", async () => {
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue([]);

      const result = await setCICSRegion();

      expect(Gui.infoMessage).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("should return undefined when no profile is selected", async () => {
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["profile1"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      const result = await setCICSRegion();

      expect(result).toBeUndefined();
    });

    it("should handle profile with cicsPlex and regionName", async () => {
      mockProfile.profile.cicsPlex = "testPlex";
      mockProfile.profile.regionName = "testRegion";

      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockImplementation((qp, placeholder, items) => {
        return Promise.resolve(items[0]); // Return the first FilterDescriptor from the array
      });
      (regionUtils.setLastUsedRegion as jest.Mock) = jest.fn();

      const result = await setCICSRegion();

      expect(result).toBeDefined();
      expect(result?.regionName).toBe("testRegion");
      expect(result?.cicsPlexName).toBe("testPlex");
      expect(regionUtils.setLastUsedRegion).toHaveBeenCalled();
    });

    it("should handle profile with only cicsPlex", async () => {
      mockProfile.profile.cicsPlex = "testPlex";

      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest
        .fn()
        .mockImplementationOnce((qp, placeholder, items) => Promise.resolve(items[0]))
        .mockResolvedValueOnce({ label: "region1" });
      (ProfileManagement.getRegionInfo as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [{ cicsname: "region1", cicsstate: "ACTIVE" }],
        hasLimitedResults: false,
      });
      (regionUtils.setLastUsedRegion as jest.Mock) = jest.fn();

      const result = await setCICSRegion();

      expect(result).toBeDefined();
      expect(result?.regionName).toBe("region1");
    });

    it("should handle plexInfo with only regions", async () => {
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockImplementation((qp, placeholder, items) => {
        return Promise.resolve(items[0]);
      });
      (regionUtils.getPlexInfoFromProfile as jest.Mock) = jest
        .fn()
        .mockResolvedValue([{ plexname: null, group: false, regions: [{ applid: "region1" }] }]);
      (regionUtils.setLastUsedRegion as jest.Mock) = jest.fn();

      const result = await setCICSRegion();

      expect(result).toBeDefined();
      expect(result?.regionName).toBe("region1");
    });

    it("should handle plexInfo with plexes", async () => {
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest
        .fn()
        .mockImplementationOnce((qp, placeholder, items) => Promise.resolve(items[0]))
        .mockResolvedValueOnce({ label: "plex1" })
        .mockResolvedValueOnce({ label: "region1" });
      (regionUtils.getPlexInfoFromProfile as jest.Mock) = jest.fn().mockResolvedValue([
        { plexname: "plex1", group: false },
      ]);
      (ProfileManagement.getRegionInfo as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [{ cicsname: "region1", cicsstate: "ACTIVE" }],
        hasLimitedResults: false,
      });
      (regionUtils.setLastUsedRegion as jest.Mock) = jest.fn();

      const result = await setCICSRegion();

      expect(result).toBeDefined();
    });

    it("should show message when no regions or plexes found", async () => {
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockImplementation((qp, placeholder, items) => {
        return Promise.resolve(items[0]);
      });
      (regionUtils.getPlexInfoFromProfile as jest.Mock) = jest.fn().mockResolvedValue([{ plexname: "test", group: true }]);

      await setCICSRegion();

      expect(Gui.showMessage).toHaveBeenCalled();
    });

    it("should return null when no region is selected", async () => {
      mockProfile.profile.cicsPlex = "testPlex";

      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest
        .fn()
        .mockImplementationOnce((qp, placeholder, items) => Promise.resolve(items[0]))
        .mockResolvedValueOnce(undefined);
      (ProfileManagement.getRegionInfo as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [{ cicsname: "region1", cicsstate: "ACTIVE" }],
        hasLimitedResults: false,
      });

      const result = await setCICSRegion();

      expect(result).toBeUndefined();
    });

    it("should handle cancelled region selection", async () => {
      mockProfile.profile.cicsPlex = "testPlex";

      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest
        .fn()
        .mockImplementationOnce((qp, placeholder, items) => Promise.resolve(items[0]))
        .mockResolvedValueOnce(undefined);

      let hideCallback: (() => void) | undefined;
      mockQuickPick.onDidHide = jest.fn((cb: () => void) => {
        hideCallback = cb;
      });

      (ProfileManagement.getRegionInfo as jest.Mock) = jest.fn().mockImplementation(async () => {
        if (hideCallback) hideCallback();
        return [];
      });

      const result = await setCICSRegion();

      expect(result).toBeUndefined();
    });

    it("should show error when no active regions found", async () => {
      mockProfile.profile.cicsPlex = "testPlex";

      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockImplementation((qp, placeholder, items) => {
        return Promise.resolve(items[0]);
      });
      (ProfileManagement.getRegionInfo as jest.Mock) = jest.fn().mockResolvedValue([]);

      await setCICSRegion();

      expect(Gui.showMessage).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ severity: MessageSeverity.ERROR }));
    });

    it("should handle cancelled plex selection", async () => {
      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest.fn().mockImplementation((qp, placeholder, items) => {
        return Promise.resolve(items[0]);
      });

      let hideCallback: (() => void) | undefined;
      mockQuickPick.onDidHide = jest.fn((cb: () => void) => {
        hideCallback = cb;
      });

      (regionUtils.getPlexInfoFromProfile as jest.Mock) = jest.fn().mockImplementation(async () => {
        if (hideCallback) hideCallback();
        return null;
      });

      const result = await setCICSRegion();

      expect(result).toBeUndefined();
    });

    it("should filter inactive regions", async () => {
      mockProfile.profile.cicsPlex = "testPlex";

      (regionUtils.getAllCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(["testProfile"]);
      (regionUtils.getChoiceFromQuickPick as jest.Mock) = jest
        .fn()
        .mockImplementationOnce((qp, placeholder, items) => Promise.resolve(items[0]))
        .mockResolvedValueOnce({ label: "region1" });
      (ProfileManagement.getRegionInfo as jest.Mock) = jest.fn().mockResolvedValue({
        regions: [
          { cicsname: "region1", cicsstate: "ACTIVE" },
          { cicsname: "region2", cicsstate: "INACTIVE" },
        ],
        hasLimitedResults: false,
      });
      (regionUtils.setLastUsedRegion as jest.Mock) = jest.fn();

      const result = await setCICSRegion();

      expect(result).toBeDefined();
      expect(result?.regionName).toBe("region1");
    });
  });
});
