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
import { Gui, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import { commands, window } from "vscode";
import { CICSResourceContainerNode } from "../../../src/trees";
import * as commandUtils from "../../../src/utils/commandUtils";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import { createProfile, fetchAllProfilesMock, getJesApiMock, getMvsApiMock, showErrorMessageMock, showInfoMessageMock, vscodeExecuteCommandMock } from "../../__mocks__";

// Mock ZoweVsCodeExtension.getZoweExplorerApi()
jest.spyOn(ZoweVsCodeExtension, "getZoweExplorerApi").mockReturnValue({
  getJesApi: getJesApiMock,
  getMvsApi: getMvsApiMock,
} as any);

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
      // (Gui.showQuickPick as jest.Mock).mockResolvedValue(null);

      await commandUtils.findProfileAndShowJobSpool(cicsProfile, jobid, regionName);

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
});
