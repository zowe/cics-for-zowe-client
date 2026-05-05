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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { imperative, ZoweExplorerApiType } from "@zowe/zowe-explorer-api";
import { commands, window, TreeView } from "vscode";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import { getJobIdForRegion, getShowRegionLogs } from "../../../src/commands/showLogsCommand";
import { SessionHandler } from "../../../src/resources/SessionHandler";
import * as commandUtils from "../../../src/utils/commandUtils";
import * as resourceUtils from "../../../src/utils/resourceUtils";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";

jest.mock("vscode");
jest.mock("../../../src/resources/SessionHandler");
jest.mock("../../../src/utils/commandUtils", () => ({
  ...jest.requireActual("../../../src/utils/commandUtils"),
  findProfileAndShowJobSpool: jest.fn(),
  fetchBaseProfileWithoutError: jest.fn(),
  findRelatedZosProfiles: jest.fn(),
  doesProfileSupportConnectionType: jest.fn(),
}));
jest.mock("../../../src/utils/resourceUtils");

// Helper function to create test profiles
const createProfile = (name: string, type: string, host: string, user?: string): imperative.IProfileLoaded => ({
  name,
  type,
  profile: {
    host,
    port: 1234,
    user,
    rejectUnauthorized: false,
  },
  message: "",
  failNotFound: false,
});

describe("showLogsCommand", () => {
  let mockTreeview: Partial<TreeView<CICSRegionTree>> & { selection: CICSRegionTree[] };
  let mockProfile: Partial<{ name: string; type: string; profile: { host: string; port: number } }>;
  let mockRegionTree: CICSRegionTree;
  let mockResourceNode: CICSResourceContainerNode<IResource>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfile = {
      name: "testProfile",
      profile: {
        host: "example.com",
        port: 1234,
      },
    };

    mockTreeview = {
      selection: [],
    } as Partial<TreeView<CICSRegionTree>> & { selection: CICSRegionTree[] };

    mockRegionTree = Object.create(CICSRegionTree.prototype);
    Object.assign(mockRegionTree, {
      region: {
        jobid: "JOB12345",
        cicsname: "REGION1",
      },
      parentPlex: {
        plexName: "PLEX1",
      },
      getProfile: jest.fn().mockReturnValue(mockProfile),
    });
    // Add getRegionName as a method that returns the cicsname
    mockRegionTree.getRegionName = function() {
      return this.region.applid || this.region.cicsname;
    };

    mockResourceNode = Object.create(CICSResourceContainerNode.prototype);
    Object.assign(mockResourceNode, {
      regionName: "REGION2",
      cicsplexName: "PLEX2",
      getProfile: jest.fn().mockReturnValue(mockProfile),
    });

    (SessionHandler.getInstance as jest.Mock).mockReturnValue({
      getProfile: jest.fn().mockResolvedValue(mockProfile),
    });

    (commandUtils.findProfileAndShowJobSpool as jest.Mock).mockResolvedValue(undefined);
    (resourceUtils.runGetResource as jest.Mock).mockResolvedValue({
      response: {
        records: {
          cicsregion: {
            jobid: "JOB12345",
          },
        },
      },
    });
  });

  describe("getJobIdForRegion", () => {
    it("should return jobid from CICSRegionTree when available", async () => {
      const jobid = await getJobIdForRegion(mockRegionTree);
      expect(jobid).toBe("JOB12345");
    });

    it("should fetch jobid from CMCI when not available in CICSRegionTree", async () => {
      mockRegionTree.region.jobid = undefined;

      (resourceUtils.runGetResource as jest.Mock).mockResolvedValueOnce({
        response: {
          records: {
            cicsregion: {
              jobid: "JOB67890",
            },
          },
        },
      });

      const jobid = await getJobIdForRegion(mockRegionTree);
      expect(jobid).toBe("JOB67890");
      expect(resourceUtils.runGetResource).toHaveBeenCalledWith({
        profileName: "testProfile",
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        regionName: "REGION1",
        cicsPlex: "PLEX1",
      });
    });

    it("should fetch jobid from CMCI when records is an array", async () => {
      mockRegionTree.region.jobid = undefined;

      (resourceUtils.runGetResource as jest.Mock).mockResolvedValueOnce({
        response: {
          records: {
            cicsregion: [
              { jobid: "JOB11111" },
              { jobid: "JOB22222" },
            ],
          },
        },
      });

      const jobid = await getJobIdForRegion(mockRegionTree);
      expect(jobid).toBe("JOB11111");
    });

    it("should return undefined when CMCI request fails", async () => {
      mockRegionTree.region.jobid = undefined;

      (resourceUtils.runGetResource as jest.Mock).mockRejectedValue(new Error("CMCI error"));

      const jobid = await getJobIdForRegion(mockRegionTree);
      expect(jobid).toBeUndefined();
    });

    it("should return undefined when CMCI response has no records", async () => {
      mockRegionTree.region.jobid = undefined;

      (resourceUtils.runGetResource as jest.Mock).mockResolvedValue({
        response: {
          records: undefined,
        },
      });

      const jobid = await getJobIdForRegion(mockRegionTree);
      expect(jobid).toBeUndefined();
    });

    it("should handle CICSResourceContainerNode", async () => {
      (resourceUtils.runGetResource as jest.Mock).mockResolvedValueOnce({
        response: {
          records: {
            cicsregion: {
              jobid: "JOB99999",
            },
          },
        },
      });

      const jobid = await getJobIdForRegion(mockResourceNode);
      expect(jobid).toBe("JOB99999");
      expect(resourceUtils.runGetResource).toHaveBeenCalledWith({
        profileName: "testProfile",
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        regionName: "REGION2",
        cicsPlex: "PLEX2",
      });
    });

    it("should handle CICSRegionTree without parentPlex", async () => {
      mockRegionTree.region.jobid = undefined;
      mockRegionTree.parentPlex = undefined;

      (resourceUtils.runGetResource as jest.Mock).mockResolvedValueOnce({
        response: {
          records: {
            cicsregion: {
              jobid: "JOB55555",
            },
          },
        },
      });

      const jobid = await getJobIdForRegion(mockRegionTree);
      expect(jobid).toBe("JOB55555");
      expect(resourceUtils.runGetResource).toHaveBeenCalledWith({
        profileName: "testProfile",
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        regionName: "REGION1",
        cicsPlex: undefined,
      });
    });

    it("should handle CICSResourceContainerNode without jobid in response", async () => {
      const mockResourceNode = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        regionName: "TESTREGION",
        cicsplexName: "TESTPLEX",
      } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

      (resourceUtils.runGetResource as jest.Mock).mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
          records: {},
        },
      });

      const jobid = await getJobIdForRegion(mockResourceNode);
      expect(jobid).toBeUndefined();
    });
  });

  describe("getShowRegionLogs", () => {
    let commandCallback: Function;

    beforeEach(() => {
      (commands.registerCommand as jest.Mock).mockImplementation((cmd, callback) => {
        commandCallback = callback;
        return { dispose: jest.fn() };
      });
    });

    it("should register the command", () => {
      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);
      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.showRegionLogs",
        expect.any(Function)
      );
    });

    it("should show logs for CICSRegionTree node", async () => {
      (commandUtils.findProfileAndShowJobSpool as jest.Mock).mockResolvedValue(undefined);
      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);

      await commandCallback(mockRegionTree);

      expect(commandUtils.findProfileAndShowJobSpool).toHaveBeenCalledWith(
        mockProfile,
        "JOB12345",
        "REGION1"
      );
    });

    it("should show logs for CICSResourceContainerNode", async () => {
      (commandUtils.findProfileAndShowJobSpool as jest.Mock).mockResolvedValue(undefined);
      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);

      (resourceUtils.runGetResource as jest.Mock).mockResolvedValueOnce({
        response: {
          records: {
            cicsregion: {
              jobid: "JOB99999",
            },
          },
        },
      });

      await commandCallback(mockResourceNode);

      expect(commandUtils.findProfileAndShowJobSpool).toHaveBeenCalledWith(
        mockProfile,
        "JOB99999",
        "REGION2"
      );
    });

    it("should show error when no region selected", async () => {
      mockTreeview.selection = [];
      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);

      await commandCallback(undefined);

      expect(window.showErrorMessage).toHaveBeenCalledWith("No region selected");
      expect(commandUtils.findProfileAndShowJobSpool).not.toHaveBeenCalled();
    });

    it("should show error when node is undefined and no selection", async () => {
      mockTreeview.selection = [];
      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);

      await commandCallback(undefined);

      expect(window.showErrorMessage).toHaveBeenCalledWith("No region selected");
      expect(commandUtils.findProfileAndShowJobSpool).not.toHaveBeenCalled();
    });

    it("should show error when jobid cannot be found", async () => {
      mockRegionTree.region.jobid = undefined;
      (resourceUtils.runGetResource as jest.Mock).mockRejectedValue(new Error("CMCI error"));

      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);

      await commandCallback(mockRegionTree);

      expect(window.showErrorMessage).toHaveBeenCalledWith("Could not find Job ID for region REGION1.");
      expect(commandUtils.findProfileAndShowJobSpool).not.toHaveBeenCalled();
    });

    it("should handle error when fetching profile", async () => {
      (SessionHandler.getInstance as jest.Mock).mockReturnValue({
        getProfile: jest.fn().mockRejectedValue(new Error("Profile error")),
      });

      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);

      await expect(commandCallback(mockRegionTree)).rejects.toThrow("Profile error");
    });
  });

  describe("fetchBaseProfileWithoutError", () => {
    it("should find z/osmf base profile", async () => {
      const baseProfile = { name: "host1", profile: {}, type: "zosmf" };
      (commandUtils.fetchBaseProfileWithoutError as jest.Mock).mockResolvedValueOnce(baseProfile);

      const profile = await commandUtils.fetchBaseProfileWithoutError(
        createProfile("host1.mycics", "cics", "h1", "user")
      );
      expect(profile?.name).toEqual("host1");
    });

    it("should return undefined when no base profile exists", async () => {
      const mockProfileCache = {
        fetchBaseProfile: jest.fn().mockRejectedValue(new Error("No base profile")),
      };
      jest.spyOn(ProfileManagement, "getProfilesCache").mockReturnValue(mockProfileCache as any);

      (commandUtils.fetchBaseProfileWithoutError as jest.Mock).mockResolvedValueOnce(undefined);

      const profile = await commandUtils.fetchBaseProfileWithoutError(
        createProfile("exception", "cics", "h1", "user")
      );
      expect(profile).toBeUndefined();
    });
  });

  describe("findRelatedZosProfiles", () => {
    let h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    let h1r = createProfile("host1.myrse", "rse", "h1", "user");
    let h2 = createProfile("host2.myzosmf2", "zosmf", "h2", "user");
    let h3 = createProfile("host3.myzosmf3", "zosmf", "h3", "user");
    let h4 = createProfile("host4.myrse4", "rse", "h4", "user");
    let h5z = createProfile("myzosmf5", "zosmf", "h5", "user");
    let h5r = createProfile("myrse5", "rse", "h5", "user");
    let h6NoUser = createProfile("host6", "zosmf", "h6");
    let zosProfiles: imperative.IProfileLoaded[] = [h1z, h1r, h2, h3, h4, h5z, h5r, h6NoUser];

    beforeEach(() => {
      const mockProfileCache = {
        fetchBaseProfile: jest.fn().mockImplementation((name: string) => {
          if (name.startsWith("host1")) return Promise.resolve({ name: "host1", profile: {}, type: "base" });
          if (name.startsWith("host4")) return Promise.resolve({ name: "host4", profile: {}, type: "base" });
          return Promise.reject(new Error("No base profile"));
        }),
      };
      jest.spyOn(ProfileManagement, "getProfilesCache").mockReturnValue(mockProfileCache as any);
    });

    it("should find z/osmf profile with common base", async () => {
      (commandUtils.findRelatedZosProfiles as jest.Mock).mockResolvedValueOnce(h1z);

      const profile = await commandUtils.findRelatedZosProfiles(
        createProfile("host1.mycics", "cics", "h1", "user"),
        zosProfiles
      );
      expect(profile).toEqual(h1z);
    });

    it("should find same host z/osmf when no common base", async () => {
      (commandUtils.findRelatedZosProfiles as jest.Mock).mockResolvedValueOnce(h1z);

      const profile = await commandUtils.findRelatedZosProfiles(
        createProfile("mycics", "cics", "h1", "user"),
        zosProfiles
      );
      expect(profile).toEqual(h1z);
    });

    it("should pick RSE when only RSE available with same host", async () => {
      (commandUtils.findRelatedZosProfiles as jest.Mock).mockResolvedValueOnce(h4);

      const profile = await commandUtils.findRelatedZosProfiles(
        createProfile("host4.mycics", "cics", "h4", "user"),
        zosProfiles
      );
      expect(profile).toEqual(h4);
    });

    it("should pick connection with common base even with different host", async () => {
      (commandUtils.findRelatedZosProfiles as jest.Mock).mockResolvedValueOnce(h4);

      const profile = await commandUtils.findRelatedZosProfiles(
        createProfile("host4.mycics", "cics", "h1", "user"),
        zosProfiles
      );
      expect(profile).toEqual(h4);
    });

    it("should not offer profile without user automatically", async () => {
      (commandUtils.findRelatedZosProfiles as jest.Mock).mockResolvedValueOnce(null);

      const profile = await commandUtils.findRelatedZosProfiles(
        createProfile("host6", "cics", "h6", "user"),
        zosProfiles
      );
      expect(profile).toBeNull;
    });
  });

  describe("doesProfileSupportConnectionType", () => {
    it("should return true when connection supports JES", () => {
      (commandUtils.doesProfileSupportConnectionType as jest.Mock).mockReturnValueOnce(true);

      const supports = createProfile("host1.myzosmf", "zosmf", "h1", "user");
      expect(commandUtils.doesProfileSupportConnectionType(supports, ZoweExplorerApiType.Jes)).toEqual(true);
    });

    it("should return false when connection doesn't support JES", () => {
      (commandUtils.doesProfileSupportConnectionType as jest.Mock).mockReturnValueOnce(false);

      const doesntSupport = createProfile("host1.myzosmf", "else", "h1", "user");
      expect(commandUtils.doesProfileSupportConnectionType(doesntSupport, ZoweExplorerApiType.Jes)).toEqual(false);
    });
  });
});
