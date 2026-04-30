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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { IProfileLoaded } from "@zowe/imperative";
import { Gui, ZoweExplorerApiType, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import { TreeView } from "vscode";
import { IResourceMeta } from "../../../src/doc";
import { CICSResourceContainerNode } from "../../../src/trees";
import * as commandUtils from "../../../src/utils/commandUtils";
import { createProfile, fetchAllProfilesMock, getJesApiMock, getMvsApiMock, getUssApiMock, showErrorMessageMock, showInfoMessageMock, vscodeExecuteCommandMock } from "../../__mocks__";

// Mock ZoweVsCodeExtension.getZoweExplorerApi()
jest.spyOn(ZoweVsCodeExtension, "getZoweExplorerApi").mockReturnValue({
  getJesApi: getJesApiMock,
  getMvsApi: getMvsApiMock,
  getUssApi: getUssApiMock,
} as Partial<ReturnType<typeof ZoweVsCodeExtension.getZoweExplorerApi>> as ReturnType<typeof ZoweVsCodeExtension.getZoweExplorerApi>);

describe("Command Utils tests", () => {
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
      vscodeExecuteCommandMock.mockReset();
      showErrorMessageMock.mockReset();
    });

    it("should call zowe.jobs.setJobSpool when matching profile is found automatically", async () => {
      fetchAllProfilesMock.mockResolvedValue([zosmfProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(fetchAllProfilesMock).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "myzosmf", jobid);
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should prompt user when no matching profile is found", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue("other");
      fetchAllProfilesMock.mockResolvedValueOnce([otherProfile]).mockResolvedValueOnce([otherProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "other", jobid);
    });

    it("should show error when no profiles support JES", async () => {
      fetchAllProfilesMock.mockResolvedValue([]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(showErrorMessageMock).toHaveBeenCalledWith("Could not find any profiles that will access JES (for instance z/OSMF).");
      expect(vscodeExecuteCommandMock).not.toHaveBeenCalled();
    });

    it("should show error when promptUserForProfile returns null", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue(null);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(showErrorMessageMock).toHaveBeenCalledWith("Could not find any profiles that will access JES (for instance z/OSMF).");
      expect(vscodeExecuteCommandMock).not.toHaveBeenCalled();
    });

    it("should return early when user cancels profile selection", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue(undefined);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).not.toHaveBeenCalled();
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should filter out zftp profiles", async () => {
      const ftpProfile = createProfile("myftp", "zftp", "example.com", "user1");
      fetchAllProfilesMock.mockResolvedValue([ftpProfile, zosmfProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      // Should use zosmf profile, not ftp
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "myzosmf", jobid);
    });

    it("should filter out profiles that don't support JES", async () => {
      const unsupportedProfile = createProfile("unsupported", "other", "example.com", "user1");
      getJesApiMock.mockImplementation((profile: IProfileLoaded) => {
        if (profile.type === "zosmf") return true;
        throw new Error("Not supported");
      });
      fetchAllProfilesMock.mockResolvedValue([unsupportedProfile, zosmfProfile]);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.jobs.setJobSpool", "myzosmf", jobid);
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

  describe("findProfileAndShowDataSet", () => {
    const cicsProfile = createProfile("mycics", "cics", "example.com", "user1");
    const zosmfProfile = createProfile("myzosmf", "zosmf", "example.com", "user1");
    const datasetName = "SYS1.PROCLIB";
    const regionName = "MYREGION";

    beforeEach(() => {
      vscodeExecuteCommandMock.mockReset();
      showErrorMessageMock.mockReset();
    });

    it("should call zowe.ds.setDataSetFilter when matching profile is found automatically", async () => {
      fetchAllProfilesMock.mockResolvedValue([zosmfProfile]);

      await commandUtils.findProfileAndShowDataSet(cicsProfile, datasetName, regionName);

      expect(fetchAllProfilesMock).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.ds.setDataSetFilter", "myzosmf", datasetName);
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should prompt user when no matching profile is found", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue("other");
      fetchAllProfilesMock.mockResolvedValueOnce([otherProfile]).mockResolvedValueOnce([otherProfile]);

      await commandUtils.findProfileAndShowDataSet(cicsProfile, datasetName, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.ds.setDataSetFilter", "other", datasetName);
    });

    it("should show error when no profiles support MVS", async () => {
      fetchAllProfilesMock.mockResolvedValue([]);

      await commandUtils.findProfileAndShowDataSet(cicsProfile, datasetName, regionName);

      expect(showErrorMessageMock).toHaveBeenCalledWith("Could not find any profiles that will access Data Sets (for instance z/OSMF).");
      expect(vscodeExecuteCommandMock).not.toHaveBeenCalled();
    });

    it("should return early when user cancels profile selection", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue(undefined);

      await commandUtils.findProfileAndShowDataSet(cicsProfile, datasetName, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).not.toHaveBeenCalled();
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should filter out zftp profiles", async () => {
      const ftpProfile = createProfile("myftp", "zftp", "example.com", "user1");
      fetchAllProfilesMock.mockResolvedValue([ftpProfile, zosmfProfile]);

      await commandUtils.findProfileAndShowDataSet(cicsProfile, datasetName, regionName);

      // Should use zosmf profile, not ftp
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.ds.setDataSetFilter", "myzosmf", datasetName);
    });
  });

  describe("findProfileAndShowUssFile", () => {
    const cicsProfile = createProfile("mycics", "cics", "example.com", "user1");
    const zosmfProfile = createProfile("myzosmf", "zosmf", "example.com", "user1");
    const ussPath = "/u/user/file.txt";
    const regionName = "MYREGION";

    beforeEach(() => {
      vscodeExecuteCommandMock.mockReset();
      showErrorMessageMock.mockReset();
    });

    it("should call zowe.uss.setUssPath when matching profile is found automatically", async () => {
      fetchAllProfilesMock.mockResolvedValue([zosmfProfile]);

      await commandUtils.findProfileAndShowUssFile(cicsProfile, ussPath, regionName);

      expect(fetchAllProfilesMock).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.uss.setUssPath", "myzosmf", ussPath);
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should prompt user when no matching profile is found", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue("other");
      fetchAllProfilesMock.mockResolvedValueOnce([otherProfile]).mockResolvedValueOnce([otherProfile]);

      await commandUtils.findProfileAndShowUssFile(cicsProfile, ussPath, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.uss.setUssPath", "other", ussPath);
    });

    it("should show error when no profiles support USS", async () => {
      fetchAllProfilesMock.mockResolvedValue([]);

      await commandUtils.findProfileAndShowUssFile(cicsProfile, ussPath, regionName);

      expect(showErrorMessageMock).toHaveBeenCalledWith("Could not find any profiles that will access USS (for instance z/OSMF).");
      expect(vscodeExecuteCommandMock).not.toHaveBeenCalled();
    });

    it("should return early when user cancels profile selection", async () => {
      const otherProfile = createProfile("other", "zosmf", "different.com", "user2");
      fetchAllProfilesMock.mockResolvedValue([otherProfile]);
      (Gui.showQuickPick as jest.Mock).mockResolvedValue(undefined);

      await commandUtils.findProfileAndShowUssFile(cicsProfile, ussPath, regionName);

      expect(Gui.showQuickPick).toHaveBeenCalled();
      expect(vscodeExecuteCommandMock).not.toHaveBeenCalled();
      expect(showErrorMessageMock).not.toHaveBeenCalled();
    });

    it("should filter out zftp profiles", async () => {
      const ftpProfile = createProfile("myftp", "zftp", "example.com", "user1");
      fetchAllProfilesMock.mockResolvedValue([ftpProfile, zosmfProfile]);

      await commandUtils.findProfileAndShowUssFile(cicsProfile, ussPath, regionName);

      // Should use zosmf profile, not ftp
      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.uss.setUssPath", "myzosmf", ussPath);
    });

    it("should filter out profiles that don't support USS", async () => {
      const unsupportedProfile = createProfile("unsupported", "other", "example.com", "user1");
      getUssApiMock.mockImplementation((profile: IProfileLoaded) => {
        if (profile.type === "zosmf") return true;
        throw new Error("Not supported");
      });
      fetchAllProfilesMock.mockResolvedValue([unsupportedProfile, zosmfProfile]);

      await commandUtils.findProfileAndShowUssFile(cicsProfile, ussPath, regionName);

      expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.uss.setUssPath", "myzosmf", ussPath);
    });

    it("should handle different USS paths", async () => {
      fetchAllProfilesMock.mockResolvedValue([zosmfProfile]);

      const ussPaths = ["/var/log/app.log", "/opt/config.xml", "/home/user/data.txt"];

      for (const path of ussPaths) {
        vscodeExecuteCommandMock.mockClear();

        await commandUtils.findProfileAndShowUssFile(cicsProfile, path, regionName);

        expect(vscodeExecuteCommandMock).toHaveBeenCalledWith("zowe.uss.setUssPath", "myzosmf", path);
      }
    });
  });

  describe("doesProfileSupportConnectionType", () => {
    const profile = createProfile("test", "zosmf", "example.com", "user1");

    beforeEach(() => {
      getJesApiMock.mockReset();
      getMvsApiMock.mockReset();
      getUssApiMock.mockReset();
      // Reset to default behavior - return truthy value
      getJesApiMock.mockReturnValue({});
      getMvsApiMock.mockReturnValue({});
      getUssApiMock.mockReturnValue({});
    });

    it("should return true for supported connection types", () => {
      expect(commandUtils.doesProfileSupportConnectionType(profile, ZoweExplorerApiType.Jes)).toBe(true);
      expect(commandUtils.doesProfileSupportConnectionType(profile, ZoweExplorerApiType.Mvs)).toBe(true);
      expect(commandUtils.doesProfileSupportConnectionType(profile, ZoweExplorerApiType.Uss)).toBe(true);
    });

    it("should return false when API throws error", () => {
      getJesApiMock.mockImplementation(() => {
        throw new Error("Not supported");
      });
      const result = commandUtils.doesProfileSupportConnectionType(profile, ZoweExplorerApiType.Jes);
      expect(result).toBe(false);
    });
  });

  describe("fetchBaseProfileWithoutError", () => {
    const profile = createProfile("test", "cics", "example.com", "user1");

    it("should return undefined when fetchBaseProfile throws error", async () => {
      const mockFetchBaseProfile = jest.fn().mockRejectedValue(new Error("No base profile"));
      const mockGetProfilesCache = jest.spyOn(require("../../../src/utils/profileManagement").ProfileManagement, "getProfilesCache");
      mockGetProfilesCache.mockReturnValue({
        fetchBaseProfile: mockFetchBaseProfile,
        fetchAllProfiles: fetchAllProfilesMock,
      });

      const result = await commandUtils.fetchBaseProfileWithoutError(profile);
      expect(result).toBeUndefined();
      expect(mockFetchBaseProfile).toHaveBeenCalledWith("test");
      
      mockGetProfilesCache.mockRestore();
    });
  });

  describe("findRelatedZosProfiles", () => {
    const cicsProfile = createProfile("mycics", "cics", "example.com", "user1");
    const zosmfProfile1 = createProfile("zosmf1", "zosmf", "example.com", "user1");
    const zosmfProfile2 = createProfile("zosmf2", "zosmf", "different.com", "user2");
    const baseProfile = createProfile("base", "base", "example.com", "user1");

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should find profile by matching base profile", async () => {
      const mockFetchBaseProfile = jest.fn()
        .mockResolvedValueOnce(baseProfile) // for cicsProfile
        .mockResolvedValueOnce(baseProfile) // for zosmfProfile1
        .mockResolvedValueOnce(undefined); // for zosmfProfile2

      const mockGetProfilesCache = jest.spyOn(require("../../../src/utils/profileManagement").ProfileManagement, "getProfilesCache");
      mockGetProfilesCache.mockReturnValue({
        fetchBaseProfile: mockFetchBaseProfile,
        fetchAllProfiles: fetchAllProfilesMock,
      });

      const result = await commandUtils.findRelatedZosProfiles(cicsProfile, [zosmfProfile1, zosmfProfile2]);
      expect(result).toEqual(zosmfProfile1);
    });

    it("should find profile by matching hostname when no base profile match", async () => {
      const mockFetchBaseProfile = jest.fn().mockResolvedValue(undefined);

      const mockGetProfilesCache = jest.spyOn(require("../../../src/utils/profileManagement").ProfileManagement, "getProfilesCache");
      mockGetProfilesCache.mockReturnValue({
        fetchBaseProfile: mockFetchBaseProfile,
        fetchAllProfiles: fetchAllProfilesMock,
      });

      const result = await commandUtils.findRelatedZosProfiles(cicsProfile, [zosmfProfile1, zosmfProfile2]);
      expect(result).toEqual(zosmfProfile1);
    });

    it("should return undefined when no matching profile found", async () => {
      const mockFetchBaseProfile = jest.fn().mockResolvedValue(undefined);

      const mockGetProfilesCache = jest.spyOn(require("../../../src/utils/profileManagement").ProfileManagement, "getProfilesCache");
      mockGetProfilesCache.mockReturnValue({
        fetchBaseProfile: mockFetchBaseProfile,
        fetchAllProfiles: fetchAllProfilesMock,
      });

      const result = await commandUtils.findRelatedZosProfiles(cicsProfile, [zosmfProfile2]);
      expect(result).toBeUndefined();
    });

    it("should prioritize zosmf profiles and filter by credentials", async () => {
      const otherProfile = createProfile("other", "other", "different.com", "user1");
      const mockFetchBaseProfile = jest.fn().mockResolvedValue(undefined);

      const mockGetProfilesCache = jest.spyOn(require("../../../src/utils/profileManagement").ProfileManagement, "getProfilesCache");
      mockGetProfilesCache.mockReturnValue({
        fetchBaseProfile: mockFetchBaseProfile,
        fetchAllProfiles: fetchAllProfilesMock,
      });

      const result = await commandUtils.findRelatedZosProfiles(cicsProfile, [otherProfile, zosmfProfile1]);
      expect(result).toEqual(zosmfProfile1);
    });

    it("should filter out profiles without credentials", async () => {
      const profileWithoutUser = createProfile("nousers", "zosmf", "example.com", undefined);
      if (profileWithoutUser.profile) {
        profileWithoutUser.profile.user = undefined;
      }
      const mockFetchBaseProfile = jest.fn().mockResolvedValue(undefined);

      const mockGetProfilesCache = jest.spyOn(require("../../../src/utils/profileManagement").ProfileManagement, "getProfilesCache");
      mockGetProfilesCache.mockReturnValue({
        fetchBaseProfile: mockFetchBaseProfile,
        fetchAllProfiles: fetchAllProfilesMock,
      });

      const result = await commandUtils.findRelatedZosProfiles(cicsProfile, [profileWithoutUser, zosmfProfile1]);
      expect(result).toEqual(zosmfProfile1);
    });
  });

  describe("promptUserForProfile", () => {
    it("should return null when no profiles available", async () => {
      const result = await commandUtils.promptUserForProfile([]);
      expect(result).toBeNull();
    });

    it("should prompt for credentials when profile has no credentials", async () => {
      const profileWithoutCreds = createProfile("nocreds", "zosmf", "example.com", undefined);
      if (profileWithoutCreds.profile) {
        profileWithoutCreds.profile.user = undefined;
        profileWithoutCreds.profile.certFile = undefined;
        profileWithoutCreds.profile.tokenValue = undefined;
      }

      (Gui.showQuickPick as jest.Mock).mockResolvedValue("nocreds");
      
      const mockUpdateCredentials = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(ZoweVsCodeExtension, 'updateCredentials', {
        value: mockUpdateCredentials,
        writable: true,
        configurable: true
      });

      fetchAllProfilesMock.mockResolvedValue([profileWithoutCreds]);

      const result = await commandUtils.promptUserForProfile([profileWithoutCreds]);

      expect(mockUpdateCredentials).toHaveBeenCalled();
      expect(result).toBe("nocreds");
    });

    it("should not prompt for credentials when profile has user", async () => {
      const profileWithUser = createProfile("withuser", "zosmf", "example.com", "user1");
      (Gui.showQuickPick as jest.Mock).mockResolvedValue("withuser");
      fetchAllProfilesMock.mockResolvedValue([profileWithUser]);

      const mockUpdateCredentials = jest.fn();
      Object.defineProperty(ZoweVsCodeExtension, 'updateCredentials', {
        value: mockUpdateCredentials,
        writable: true,
        configurable: true
      });

      const result = await commandUtils.promptUserForProfile([profileWithUser]);

      expect(mockUpdateCredentials).not.toHaveBeenCalled();
      expect(result).toBe("withuser");
    });
  });

  describe("findSelectedNodes", () => {
    const mockMeta = {
      resourceName: "Program",
    } as Partial<IResourceMeta<IResource>> as IResourceMeta<IResource>;

    const createMockNode = (label: string, resourceName: string) => ({
      label,
      getContainedResource: () => ({
        meta: { resourceName },
      }),
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>);

    it("should return filtered selection when no clicked node", () => {
      const node1 = createMockNode("PROG1", "Program");
      const node2 = createMockNode("TRAN1", "Transaction");
      const mockTreeview = {
        selection: [node1, node2],
      } as Partial<TreeView<CICSResourceContainerNode<IResource>>> as TreeView<CICSResourceContainerNode<IResource>>;

      const result = commandUtils.findSelectedNodes(mockTreeview, mockMeta, undefined);
      expect(result).toEqual([node1]);
    });

    it("should return clicked node when not in selection", () => {
      const node1 = createMockNode("PROG1", "Program");
      const node2 = createMockNode("PROG2", "Program");
      const mockTreeview = {
        selection: [node1],
      } as Partial<TreeView<CICSResourceContainerNode<IResource>>> as TreeView<CICSResourceContainerNode<IResource>>;

      const result = commandUtils.findSelectedNodes(mockTreeview, mockMeta, node2);
      expect(result).toEqual([node2]);
    });

    it("should return filtered selection when clicked node is in selection", () => {
      const node1 = createMockNode("PROG1", "Program");
      const node2 = createMockNode("TRAN1", "Transaction");
      const node3 = createMockNode("PROG2", "Program");
      const mockTreeview = {
        selection: [node1, node2, node3],
      } as Partial<TreeView<CICSResourceContainerNode<IResource>>> as TreeView<CICSResourceContainerNode<IResource>>;

      const result = commandUtils.findSelectedNodes(mockTreeview, mockMeta, node1);
      expect(result).toEqual([node1, node3]);
    });
  });

  describe("toArray", () => {
    it("should return array when input is array", () => {
      const input = [1, 2, 3];
      const result = commandUtils.toArray(input);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should wrap single value in array", () => {
      const input = "test";
      const result = commandUtils.toArray(input);
      expect(result).toEqual(["test"]);
    });

    it("should handle objects", () => {
      const input = { key: "value" };
      const result = commandUtils.toArray(input);
      expect(result).toEqual([{ key: "value" }]);
    });
  });

  describe("getResourceTree", () => {
    const mockTreeview = {
      reveal: jest.fn().mockResolvedValue(undefined),
    } as Partial<TreeView<CICSResourceContainerNode<IResource>>> as TreeView<CICSResourceContainerNode<IResource>>;

    it("should throw error when region name is missing", async () => {
      const mockNode = {
        description: "",
        getParent: jest.fn(),
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      await expect(commandUtils.getResourceTree(mockTreeview, [mockNode], "Program")).rejects.toThrow(
        "Region name is missing in the node description."
      );
    });

    it("should return undefined when regions node not found", async () => {
      const mockNode = {
        description: "Test (REGION1)",
        getParent: jest.fn().mockReturnValue({
          getParent: jest.fn().mockReturnValue({
            children: [],
          }),
        }),
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      const result = await commandUtils.getResourceTree(mockTreeview, [mockNode], "Program");
      expect(result).toBeUndefined();
    });

    it("should return undefined when region tree not found", async () => {
      const mockRegionsNode = {
        children: [],
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      const mockNode = {
        description: "Test (REGION1)",
        getParent: jest.fn().mockReturnValue({
          getParent: jest.fn().mockReturnValue({
            children: [mockRegionsNode],
          }),
        }),
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      mockRegionsNode.label = "Regions";

      const result = await commandUtils.getResourceTree(mockTreeview, [mockNode], "Program");
      expect(result).toBeUndefined();
    });

    it("should find and return resource tree", async () => {
      const mockResourceTree = {
        resourceTypes: [{ resourceName: "Program" }],
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      const mockRegionTree = {
        label: "REGION1",
        children: [mockResourceTree],
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      const mockRegionsNode = {
        label: "Regions",
        children: [mockRegionTree],
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      const mockNode = {
        description: "Test (REGION1)",
        getParent: jest.fn().mockReturnValue({
          getParent: jest.fn().mockReturnValue({
            children: [mockRegionsNode],
          }),
        }),
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      const result = await commandUtils.getResourceTree(mockTreeview, [mockNode], "Program");
      expect(result).toEqual(mockResourceTree);
      expect(mockTreeview.reveal).toHaveBeenCalledWith(mockRegionsNode, { expand: true });
      expect(mockTreeview.reveal).toHaveBeenCalledWith(mockRegionTree, { expand: true });
    });
  });
});
