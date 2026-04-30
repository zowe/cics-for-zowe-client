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
import { commands, window, TreeView } from "vscode";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import { getJobIdForRegion, getShowRegionLogs } from "../../../src/commands/showLogsCommand";
import { SessionHandler } from "../../../src/resources/SessionHandler";
import * as commandUtils from "../../../src/utils/commandUtils";
import * as resourceUtils from "../../../src/utils/resourceUtils";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";

jest.mock("vscode");
jest.mock("../../../src/resources/SessionHandler");
jest.mock("../../../src/utils/commandUtils", () => ({
  ...jest.requireActual("../../../src/utils/commandUtils"),
  findProfileAndShowJobSpool: jest.fn(),
}));
jest.mock("../../../src/utils/resourceUtils");

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

    it("should use treeview selection when node is undefined", async () => {
      (commandUtils.findProfileAndShowJobSpool as jest.Mock).mockResolvedValue(undefined);
      mockTreeview.selection = [mockRegionTree];
      getShowRegionLogs(mockTreeview as TreeView<CICSRegionTree>);

      await commandCallback(undefined);

      expect(commandUtils.findProfileAndShowJobSpool).toHaveBeenCalledWith(
        mockProfile,
        "JOB12345",
        "REGION1"
      );
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
});


