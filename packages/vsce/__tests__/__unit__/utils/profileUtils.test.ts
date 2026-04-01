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

import { window } from "vscode";
import { ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import {
  missingSessionParameters,
  missingUsernamePassword,
  updateProfile,
  promptCredentials,
} from "../../../src/utils/profileUtils";
import { ProfileManagement } from "../../../src/utils/profileManagement";

jest.mock("vscode");
jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/utils/profileManagement");

describe("profileUtils", () => {
  let mockProfile: any;
  let mockSessionTree: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfile = {
      name: "testProfile",
      type: "cics",
      profile: {
        host: "test.com",
        port: 1234,
        user: "testuser",
        password: "testpass",
        protocol: "https",
      },
      message: "",
      failNotFound: false,
    };

    mockSessionTree = {
      getIsUnauthorized: jest.fn().mockReturnValue(false),
    };

    (window.showInformationMessage as jest.Mock) = jest.fn();
  });

  describe("missingSessionParameters", () => {
    it("should return empty array when all parameters are present", () => {
      const result = missingSessionParameters(mockProfile.profile);
      expect(result).toEqual([]);
    });

    it("should return missing host parameter", () => {
      delete mockProfile.profile.host;
      const result = missingSessionParameters(mockProfile.profile);
      expect(result).toContain("host");
    });

    it("should return missing port parameter", () => {
      delete mockProfile.profile.port;
      const result = missingSessionParameters(mockProfile.profile);
      expect(result).toContain("port");
    });

    it("should return missing user parameter", () => {
      delete mockProfile.profile.user;
      const result = missingSessionParameters(mockProfile.profile);
      expect(result).toContain("user");
    });

    it("should return missing password parameter", () => {
      delete mockProfile.profile.password;
      const result = missingSessionParameters(mockProfile.profile);
      expect(result).toContain("password");
    });

    it("should return missing protocol parameter", () => {
      delete mockProfile.profile.protocol;
      const result = missingSessionParameters(mockProfile.profile);
      expect(result).toContain("protocol");
    });

    it("should return multiple missing parameters", () => {
      delete mockProfile.profile.host;
      delete mockProfile.profile.user;
      delete mockProfile.profile.password;
      const result = missingSessionParameters(mockProfile.profile);
      expect(result).toContain("host");
      expect(result).toContain("user");
      expect(result).toContain("password");
      expect(result.length).toBe(3);
    });
  });

  describe("missingUsernamePassword", () => {
    it("should return false when no parameters are missing", () => {
      const result = missingUsernamePassword([]);
      expect(result).toBe(false);
    });

    it("should return true when user is missing", () => {
      const result = missingUsernamePassword(["user"]);
      expect(result).toBe(true);
    });

    it("should return true when password is missing", () => {
      const result = missingUsernamePassword(["password"]);
      expect(result).toBe(true);
    });

    it("should return true when both user and password are missing", () => {
      const result = missingUsernamePassword(["user", "password"]);
      expect(result).toBe(true);
    });

    it("should return false when only other parameters are missing", () => {
      const result = missingUsernamePassword(["host", "port"]);
      expect(result).toBe(false);
    });

    it("should return true when user is missing along with other parameters", () => {
      const result = missingUsernamePassword(["host", "user", "port"]);
      expect(result).toBe(true);
    });
  });

  describe("updateProfile", () => {
    beforeEach(() => {
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn();
      (ProfileManagement.getProfilesCache as jest.Mock) = jest.fn().mockReturnValue({});
      (ProfileManagement.getExplorerApis as jest.Mock) = jest.fn().mockReturnValue({});
    });

    it("should return undefined when no missing parameters and not unauthorized", async () => {
      const result = await updateProfile(mockProfile, mockSessionTree);
      expect(result).toBeUndefined();
    });

    it("should prompt for credentials when user is missing", async () => {
      delete mockProfile.profile.user;
      const updatedProfile = { ...mockProfile, profile: { ...mockProfile.profile, user: "newuser" } };
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(updatedProfile);

      const result = await updateProfile(mockProfile, mockSessionTree);

      expect(ZoweVsCodeExtension.updateCredentials).toHaveBeenCalled();
      expect(result).toEqual(updatedProfile);
    });

    it("should prompt for credentials when password is missing", async () => {
      delete mockProfile.profile.password;
      const updatedProfile = { ...mockProfile, profile: { ...mockProfile.profile, password: "newpass" } };
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(updatedProfile);

      const result = await updateProfile(mockProfile, mockSessionTree);

      expect(ZoweVsCodeExtension.updateCredentials).toHaveBeenCalled();
      expect(result).toEqual(updatedProfile);
    });

    it("should prompt for credentials when session tree is unauthorized", async () => {
      mockSessionTree.getIsUnauthorized.mockReturnValue(true);
      const updatedProfile = { ...mockProfile };
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(updatedProfile);

      const result = await updateProfile(mockProfile, mockSessionTree);

      expect(ZoweVsCodeExtension.updateCredentials).toHaveBeenCalled();
      expect(result).toEqual(updatedProfile);
    });

    it("should show information message when other parameters are still missing after credential update", async () => {
      delete mockProfile.profile.user;
      delete mockProfile.profile.host;
      const updatedProfile = { ...mockProfile, profile: { ...mockProfile.profile, user: "newuser" } };
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(updatedProfile);

      const result = await updateProfile(mockProfile, mockSessionTree);

      expect(window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("host")
      );
      expect(result).toBeUndefined();
    });

    it("should return profile when all missing parameters are resolved", async () => {
      delete mockProfile.profile.user;
      delete mockProfile.profile.password;
      const updatedProfile = {
        ...mockProfile,
        profile: { ...mockProfile.profile, user: "newuser", password: "newpass" },
      };
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(updatedProfile);

      const result = await updateProfile(mockProfile, mockSessionTree);

      expect(result).toEqual(updatedProfile);
      expect(window.showInformationMessage).not.toHaveBeenCalled();
    });

    it("should handle user cancelling credential prompt", async () => {
      delete mockProfile.profile.user;
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await updateProfile(mockProfile, mockSessionTree);

      expect(result).toBeUndefined();
    });
  });

  describe("promptCredentials", () => {
    beforeEach(() => {
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn();
      (ProfileManagement.getProfilesCache as jest.Mock) = jest.fn().mockReturnValue({});
      (ProfileManagement.getExplorerApis as jest.Mock) = jest.fn().mockReturnValue({});
    });

    it("should call ZoweVsCodeExtension.updateCredentials with correct parameters", async () => {
      const updatedProfile = { ...mockProfile };
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(updatedProfile);

      const result = await promptCredentials(mockProfile);

      expect(ZoweVsCodeExtension.updateCredentials).toHaveBeenCalledWith(
        {
          profile: mockProfile,
          rePrompt: true,
          zeProfiles: expect.anything(),
        },
        expect.anything()
      );
      expect(result).toEqual(updatedProfile);
    });

    it("should show information message when user cancels", async () => {
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await promptCredentials(mockProfile);

      expect(window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("Input credentials operation Cancelled")
      );
      expect(result).toBeNull();
    });

    it("should return updated profile when credentials are provided", async () => {
      const updatedProfile = {
        ...mockProfile,
        profile: { ...mockProfile.profile, user: "newuser", password: "newpass" },
      };
      (ZoweVsCodeExtension.updateCredentials as jest.Mock) = jest.fn().mockResolvedValue(updatedProfile);

      const result = await promptCredentials(mockProfile);

      expect(result).toEqual(updatedProfile);
      expect(window.showInformationMessage).not.toHaveBeenCalled();
    });
  });
});