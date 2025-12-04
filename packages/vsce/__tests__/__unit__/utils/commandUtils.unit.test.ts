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

const fetchAllProfilesMock = jest.fn();
const fetchBaseProfileMock = jest.fn();

// Mock ProfileManagement before importing commandUtils
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: jest.fn().mockReturnValue({
      fetchBaseProfile: fetchBaseProfileMock,
      fetchAllProfiles: fetchAllProfilesMock,
    }),
    getExplorerApis: jest.fn(),
    zoweExplorerAPI: {
      getExplorerExtenderApi: jest.fn().mockReturnValue({
        getProfilesCache: jest.fn(),
      }),
    },
  },
}));

const getJesApiMock = jest.fn();
const updateCredentialsMock = jest.fn();

// Mock ZoweVsCodeExtension
jest.mock("@zowe/zowe-explorer-api", () => ({
  ZoweVsCodeExtension: {
    getZoweExplorerApi: jest.fn().mockReturnValue({
      getJesApi: getJesApiMock,
      getExplorerExtenderApi: jest.fn().mockReturnValue({
        getProfilesCache: jest.fn(),
      }),
    }),
    updateCredentials: updateCredentialsMock,
  },
  Gui: {
    showMessage: jest.fn(),
    showQuickPick: jest.fn(),
  },
  MessageSeverity: {
    ERROR: 0,
  },
  ZoweExplorerApiType: {
    Jes: "JES",
  },
}));

// Mock CICSLogger
jest.mock("../../../src/utils/CICSLogger", () => ({
  CICSLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock vscode
const executeCommandMock = jest.fn();
const showErrorMessageMock = jest.fn();
const showInfoMessageMock = jest.fn();
jest.mock(
  "vscode",
  () => ({
    commands: {
      executeCommand: executeCommandMock,
    },
    window: {
      showErrorMessage: showErrorMessageMock,
      showInformationMessage: showInfoMessageMock,
    },
    l10n: {
      t: (str: string, ...args: any[]) => {
        // Simple mock implementation that replaces {0}, {1} etc with args
        return str.replace(/\{(\d+)\}/g, (match, index) => args[index] || match);
      },
    },
  }),
  { virtual: true }
);

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { IProfileLoaded } from "@zowe/imperative";
import { Gui } from "@zowe/zowe-explorer-api";
import { CICSResourceContainerNode } from "../../../src/trees";
import * as commandUtils from "../../../src/utils/commandUtils";

function createProfile(name: string, type: string, host: string, user?: string): IProfileLoaded {
  return {
    name: name,
    message: "",
    type: type,
    failNotFound: false,
    profile: {
      user: user,
      host: host,
    },
  } as IProfileLoaded;
}

describe("Command Utils tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("splitCmciErrorMessage", () => {
    const testError = "Test\nCmci Error\nresp:1\nresp2:2\nresp_alt:3\neibfn_alt:4";
    it("should return something", () => {
      const response = commandUtils.splitCmciErrorMessage(testError);
      expect(response).toEqual(["1", "2", "3", "4"]);
    });
  });

  describe("findProfileAndShowJobSpool", () => {
    const cicsProfile = createProfile("mycics", "cics", "example.com", "user1");
    const zosmfProfile = createProfile("myzosmf", "zosmf", "example.com", "user1");
    const jobid = "JOB12345";
    const regionName = "MYREGION";

    beforeEach(() => {
      getJesApiMock.mockReturnValue(true);
    });

    it("should call zowe.jobs.setJobSpool when matching profile is found automatically", async () => {
      fetchAllProfilesMock.mockResolvedValue([zosmfProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(fetchAllProfilesMock).toHaveBeenCalled();
      expect(executeCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "myzosmf", jobid);
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should prompt user when no matching profile is found", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue("other");
      fetchAllProfilesMock.mockResolvedValueOnce([otherProfile]).mockResolvedValueOnce([otherProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(executeCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "other", jobid);
    });

    it("should show error when no profiles support JES", async () => {
      fetchAllProfilesMock.mockResolvedValue([]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue(null);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(showErrorMessageMock).toHaveBeenCalledWith("Could not find any profiles that will access JES (for instance z/OSMF).");
      expect(executeCommandMock).not.toHaveBeenCalled();
    });

    it("should return early when user cancels profile selection", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue(undefined);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(executeCommandMock).not.toHaveBeenCalled();
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should filter out zftp profiles", async () => {
      const ftpProfile = createProfile("myftp", "zftp", "example.com", "user1");
      fetchAllProfilesMock.mockResolvedValue([ftpProfile, zosmfProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      // Should use zosmf profile, not ftp
      expect(executeCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "myzosmf", jobid);
    });

    it("should filter out profiles that don't support JES", async () => {
      const unsupportedProfile = createProfile("unsupported", "other", "example.com", "user1");
      getJesApiMock.mockImplementation((profile: IProfileLoaded) => {
        if (profile.type === "zosmf") return true;
        throw new Error("Not supported");
      });
      fetchAllProfilesMock.mockResolvedValue([unsupportedProfile, zosmfProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(executeCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "myzosmf", jobid);
    });
  });

  describe("Confirmation modal", () => {
    it("should build list of resource names when 1 node provided", () => {
      const nodes = [{ label: "MYRES1" }] as CICSResourceContainerNode<IResource>[];

      const description = commandUtils.buildConfirmationDescription(nodes);
      expect(description).toEqual(["MYRES1"]);
    });

    it("should build list of resource names when 2 nodes provided", () => {
      const nodes = [{ label: "MYRES1" }, { label: "MYRES2" }] as CICSResourceContainerNode<IResource>[];

      const description = commandUtils.buildConfirmationDescription(nodes);
      expect(description).toEqual(["MYRES1", "MYRES2"]);
    });

    it("should build list of resource names when 10 nodes provided", () => {
      const nodes = [];
      for (let i = 0; i < 10; i++) {
        nodes.push({ label: `MYRES${i}` } as CICSResourceContainerNode<IResource>);
      }

      const description = commandUtils.buildConfirmationDescription(nodes);
      expect(description).toEqual(["MYRES0", "MYRES1", "MYRES2", "MYRES3", "MYRES4", "MYRES5", "MYRES6", "MYRES7", "MYRES8", "MYRES9"]);
    });

    it("should build list of resource names when more than 10 nodes provided", () => {
      const nodes = [];
      for (let i = 0; i < 15; i++) {
        nodes.push({ label: `MYRES${i}` } as CICSResourceContainerNode<IResource>);
      }

      const description = commandUtils.buildConfirmationDescription(nodes);
      expect(description).toEqual(["MYRES0", "MYRES1", "MYRES2", "MYRES3", "MYRES4", "MYRES5", "MYRES6", "MYRES7", "MYRES8", "MYRES9", "...5 more"]);
    });

    it("should show info message with action and resource type", async () => {
      showInfoMessageMock.mockReturnValue("DELETE");
      await commandUtils.getConfirmationForAction("DELETE", "TS Queues", ["MYRES1"]);
      expect(showInfoMessageMock).toHaveBeenCalledWith(
        "Are you sure you want to DELETE the following TS Queues?",
        { modal: true, detail: "MYRES1" },
        "DELETE"
      );
    });

    it("should show info message with different action and resource type", async () => {
      showInfoMessageMock.mockReturnValue("Purge");
      await commandUtils.getConfirmationForAction("Purge", "Tasks", ["Tsk1", "Tsk2"]);
      expect(showInfoMessageMock).toHaveBeenCalledWith(
        "Are you sure you want to Purge the following Tasks?",
        { modal: true, detail: "Tsk1\nTsk2" },
        "Purge"
      );
    });
  });
});
