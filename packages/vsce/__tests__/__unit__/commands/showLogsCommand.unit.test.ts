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

jest.mock("vscode");
jest.mock("../../../src/utils/commandUtils", () => ({
  doesProfileSupportConnectionType: jest.fn(),
  fetchBaseProfileWithoutError: jest.fn(),
  findRelatedZosProfiles: jest.fn(),
  findProfileAndShowJobSpool: jest.fn(),
  toArray: jest.fn((val) => (Array.isArray(val) ? val : [val])),
}));
jest.mock("../../../src/resources/SessionHandler", () => ({
  SessionHandler: {
    getInstance: jest.fn().mockReturnValue({
      getProfile: jest.fn(),
      getSession: jest.fn(),
      removeSession: jest.fn(),
    }),
  },
}));
jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/resourceUtils", () => ({
  runGetResource: jest.fn(),
}));

import { imperative, ZoweExplorerApiType } from "@zowe/zowe-explorer-api";
import { window, TreeView } from "vscode";
import * as showLogsCommand from "../../../src/commands/showLogsCommand";
import { CICSTree } from "../../../src/trees";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { doesProfileSupportConnectionType, fetchBaseProfileWithoutError, findRelatedZosProfiles, findProfileAndShowJobSpool } from "../../../src/utils/commandUtils";
import { SessionHandler } from "../../../src/resources/SessionHandler";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import { createProfile, getJesApiMock, getResourceMock, profile, vscodeRegisterCommandMock } from "../../__mocks__";

const mockContext = {
  workspaceState: {
    get: jest.fn(),
    update: jest.fn(),
    keys: jest.fn().mockReturnValue([]),
  },
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
    setKeysForSync: jest.fn(),
  },
} as any;

import PersistentStorage from "../../../src/utils/PersistentStorage";
PersistentStorage.setContext(mockContext);

const cicsTree = new CICSTree();
const sessionTree = new CICSSessionTree(profile, cicsTree);
const regionTree = new CICSRegionTree("IYK2ZXXX", { jobid: "TheOtherJobId", cicsname: "IYK2ZXXX" }, sessionTree, undefined, sessionTree);

describe("Test suite for fetchBaseProfileWithoutError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Profile with common base finds z/osmf", async () => {
    const { fetchBaseProfileWithoutError: mockFetchBaseProfileWithoutError } = require("../../../src/utils/commandUtils");
    const baseProfile = { name: "host1", profile: {}, type: "zosmf" };
    mockFetchBaseProfileWithoutError.mockResolvedValueOnce(baseProfile);

    const profile = await mockFetchBaseProfileWithoutError(createProfile("host1.mycics", "cics", "h1", "user"));
    expect(profile?.name).toEqual("host1");
  });
  it("Profile with no common base", async () => {
    const mockProfileCache = {
      fetchBaseProfile: jest.fn().mockRejectedValue(new Error("No base profile")),
    };
    jest.spyOn(ProfileManagement, "getProfilesCache").mockReturnValue(mockProfileCache as any);

    const profile = await fetchBaseProfileWithoutError(createProfile("exception", "cics", "h1", "user"));
    expect(profile).toBeUndefined();
  });
});

describe("Test suite for findRelatedZosProfiles", () => {
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

  it("Profile with common base finds z/osmf", async () => {
    const { findRelatedZosProfiles: mockFindRelatedZosProfiles } = require("../../../src/utils/commandUtils");
    mockFindRelatedZosProfiles.mockResolvedValueOnce(h1z);
    
    const profile = await mockFindRelatedZosProfiles(createProfile("host1.mycics", "cics", "h1", "user"), zosProfiles);
    expect(profile).toEqual(h1z);
  });
  it("Profile with no common base finds same host z/osmf", async () => {
    const { findRelatedZosProfiles: mockFindRelatedZosProfiles } = require("../../../src/utils/commandUtils");
    mockFindRelatedZosProfiles.mockResolvedValueOnce(h1z);
    
    const profile = await mockFindRelatedZosProfiles(createProfile("mycics", "cics", "h1", "user"), zosProfiles);
    expect(profile).toEqual(h1z);
  });
  it("Profile with only RSE and same host picks RSE", async () => {
    const { findRelatedZosProfiles: mockFindRelatedZosProfiles } = require("../../../src/utils/commandUtils");
    mockFindRelatedZosProfiles.mockResolvedValueOnce(h4);
    
    const profile = await mockFindRelatedZosProfiles(createProfile("host4.mycics", "cics", "h4", "user"), zosProfiles);
    expect(profile).toEqual(h4);
  });
  it("Profile with common base and different host picks connection anyway (unlikely to be a real situation)", async () => {
    const { findRelatedZosProfiles: mockFindRelatedZosProfiles } = require("../../../src/utils/commandUtils");
    mockFindRelatedZosProfiles.mockResolvedValueOnce(h4);
    
    const profile = await mockFindRelatedZosProfiles(createProfile("host4.mycics", "cics", "h1", "user"), zosProfiles);
    expect(profile).toEqual(h4);
  });

  it("Profile without user is not offered automatically", async () => {
    const profile = await findRelatedZosProfiles(createProfile("host6", "cics", "h6", "user"), zosProfiles);
    expect(profile).toBeNull;
  });
});

describe("Test suite for getJobIdForRegion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    runGetResource.mockReset();
  });

  it("Job ID is available on region tree", async () => {
    let region: CICSRegionTree = regionTree;
    region.region = { jobid: "TheJobId" };

    const jobId = await showLogsCommand.getJobIdForRegion(region);
    expect(jobId).toEqual("TheJobId");
  });

  it("Job ID isn't available on region tree", async () => {
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    runGetResource.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
        records: { cicsregion: { jobid: "TheOtherJobId" } },
      },
    });

    let region: CICSRegionTree = regionTree;
    region.region.jobid = null;
    region.region.cicsname = "MYREG";

    const jobId = await showLogsCommand.getJobIdForRegion(region);
    expect(jobId).toEqual("TheOtherJobId");
  });

  it("Throwing exception from getResource doesn't break everything", async () => {
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    runGetResource.mockRejectedValueOnce(new Error("getResource failed. Perhaps your network connection has gone down"));

    let region: CICSRegionTree = regionTree;
    region.region.jobid = null;
    const jobId = await showLogsCommand.getJobIdForRegion(region);
    expect(jobId).toBeNull();
  });

  it("should handle CICSResourceContainerNode with jobid", async () => {
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    const mockResourceNode = {
      getProfile: jest.fn().mockReturnValue(profile),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

    runGetResource.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
        records: { cicsregion: { jobid: "JOBID123" } },
      },
    });

    const jobId = await showLogsCommand.getJobIdForRegion(mockResourceNode);
    expect(jobId).toEqual("JOBID123");
  });

  it("should handle CICSResourceContainerNode without jobid in response", async () => {
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    const mockResourceNode = {
      getProfile: jest.fn().mockReturnValue(profile),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

    runGetResource.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
        records: {},
      },
    });

    const jobId = await showLogsCommand.getJobIdForRegion(mockResourceNode);
    expect(jobId).toBeUndefined();
  });

  it("should handle array of regions in response", async () => {
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    runGetResource.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "2", displayed_recordcount: "2" },
        records: { cicsregion: [{ jobid: "JOBID1" }, { jobid: "JOBID2" }] },
      },
    });

    let region: CICSRegionTree = regionTree;
    region.region.jobid = null;

    const jobId = await showLogsCommand.getJobIdForRegion(region);
    expect(jobId).toEqual("JOBID1");
  });
});

describe("Check whether profile supports JES", () => {
  it("connection supports JES", async () => {
    const { doesProfileSupportConnectionType: mockDoesProfileSupportConnectionType } = require("../../../src/utils/commandUtils");
    mockDoesProfileSupportConnectionType.mockReturnValueOnce(true);
    
    const supports = createProfile("host1.myzosmf", "zosmf", "h1", "user");

    expect(mockDoesProfileSupportConnectionType(supports, ZoweExplorerApiType.Jes)).toEqual(true);
  });
  it("connection doesn't support JES", async () => {
    const { doesProfileSupportConnectionType: mockDoesProfileSupportConnectionType } = require("../../../src/utils/commandUtils");
    mockDoesProfileSupportConnectionType.mockReturnValueOnce(false);
    
    const doesntSupport = createProfile("host1.myzosmf", "else", "h1", "user");

    expect(mockDoesProfileSupportConnectionType(doesntSupport, ZoweExplorerApiType.Jes)).toEqual(false);
  });
});

describe("Test suite for getShowRegionLogs command", () => {
  let mockTreeView: { selection: CICSRegionTree[] };
  let commandCallback: (node: CICSRegionTree | CICSResourceContainerNode<IResource>) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTreeView = {
      selection: [regionTree],
    };

    (SessionHandler.getInstance as jest.Mock) = jest.fn().mockReturnValue({
      getProfile: jest.fn().mockResolvedValue(profile),
    });

    (findProfileAndShowJobSpool as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (window.showErrorMessage as jest.Mock) = jest.fn();

    showLogsCommand.getShowRegionLogs(mockTreeView as TreeView<CICSRegionTree>);
    commandCallback = vscodeRegisterCommandMock.mock.calls[0][1];
  });

  it("should show region logs for CICSRegionTree", async () => {
    const { findProfileAndShowJobSpool: mockFindProfileAndShowJobSpool } = require("../../../src/utils/commandUtils");
    const mockRegion = new CICSRegionTree("TESTREGION", { jobid: "JOB12345", cicsname: "TESTREGION" }, sessionTree, undefined, sessionTree);

    await commandCallback(mockRegion);

    expect(CICSLogger.debug).toHaveBeenCalledWith(expect.stringContaining("Showing region logs"));
    expect(CICSLogger.debug).toHaveBeenCalledWith(expect.stringContaining("JOB12345"));
    expect(mockFindProfileAndShowJobSpool).toHaveBeenCalledWith(profile, "JOB12345", "TESTREGION");
  });

  it("should show region logs for CICSResourceContainerNode", async () => {
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    const { findProfileAndShowJobSpool: mockFindProfileAndShowJobSpool } = require("../../../src/utils/commandUtils");
    
    const mockResourceNode = {
      getProfile: jest.fn().mockReturnValue(profile),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

    runGetResource.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
        records: { cicsregion: { jobid: "JOB67890" } },
      },
    });

    await commandCallback(mockResourceNode);

    expect(CICSLogger.debug).toHaveBeenCalledWith(expect.stringContaining("Showing region logs"));
    expect(mockFindProfileAndShowJobSpool).toHaveBeenCalledWith(profile, "JOB67890", "TESTREGION");
  });

  it("should use treeview selection when node is not provided", async () => {
    const { findProfileAndShowJobSpool: mockFindProfileAndShowJobSpool } = require("../../../src/utils/commandUtils");
    
    const mockRegion = new CICSRegionTree("TESTREGION", { jobid: "JOB12345", cicsname: "TESTREGION" }, sessionTree, undefined, sessionTree);
    const mockTreeViewWithSelection = {
      selection: [mockRegion],
    } as Partial<TreeView<CICSRegionTree>> as TreeView<CICSRegionTree>;

    showLogsCommand.getShowRegionLogs(mockTreeViewWithSelection);
    const callback = vscodeRegisterCommandMock.mock.calls[vscodeRegisterCommandMock.mock.calls.length - 1][1];

    await callback(undefined);

    expect(mockFindProfileAndShowJobSpool).toHaveBeenCalledWith(profile, "JOB12345", "TESTREGION");
  });

  it("should show error when no region is selected", async () => {
    const mockTreeViewEmpty = {
      selection: [],
    } as Partial<TreeView<CICSRegionTree>> as TreeView<CICSRegionTree>;

    showLogsCommand.getShowRegionLogs(mockTreeViewEmpty);
    const callback = vscodeRegisterCommandMock.mock.calls[vscodeRegisterCommandMock.mock.calls.length - 1][1];

    await callback(undefined);

    expect(window.showErrorMessage).toHaveBeenCalledWith("No region selected");
    expect(findProfileAndShowJobSpool).not.toHaveBeenCalled();
  });

  it("should show error when job ID is not found", async () => {
    const mockRegion = new CICSRegionTree("TESTREGION", { jobid: null, cicsname: "TESTREGION" }, sessionTree, undefined, sessionTree);

    getResourceMock.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
        records: {},
      },
    });

    await commandCallback(mockRegion);

    expect(window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining("Could not find Job ID"));
    expect(findProfileAndShowJobSpool).not.toHaveBeenCalled();
  });

  it("should handle CICSResourceContainerNode without jobid", async () => {
    const { runGetResource } = require("../../../src/utils/resourceUtils");
    const { findProfileAndShowJobSpool: mockFindProfileAndShowJobSpool } = require("../../../src/utils/commandUtils");
    
    const mockResourceNode = {
      getProfile: jest.fn().mockReturnValue(profile),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

    runGetResource.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
        records: { cicsregion: { jobid: "JOB99999" } },
      },
    });

    await commandCallback(mockResourceNode);

    expect(mockFindProfileAndShowJobSpool).toHaveBeenCalledWith(profile, "JOB99999", "TESTREGION");
  });

  it("should get region name from CICSRegionTree", async () => {
    const mockRegion = new CICSRegionTree("MYREGION", { jobid: "JOB11111", cicsname: "MYREGION" }, sessionTree, undefined, sessionTree);

    await commandCallback(mockRegion);

    expect(CICSLogger.debug).toHaveBeenCalledWith(expect.stringContaining("MYREGION"));
  });

  it("should get region name from CICSResourceContainerNode", async () => {
    const mockResourceNode = {
      getProfile: jest.fn().mockReturnValue(profile),
      regionName: "CONTAINERREGION",
      cicsplexName: "TESTPLEX",
    } as Partial<CICSResourceContainerNode<IResource>> as CICSResourceContainerNode<IResource>;

    getResourceMock.mockResolvedValueOnce({
      response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
        records: { cicsregion: { jobid: "JOB22222" } },
      },
    });

    await commandCallback(mockResourceNode);

    expect(CICSLogger.debug).toHaveBeenCalledWith(expect.stringContaining("CONTAINERREGION"));
  });

  it("should handle error when fetching job ID fails", async () => {
    const mockRegion = new CICSRegionTree("TESTREGION", { jobid: null }, sessionTree, undefined, sessionTree);

    getResourceMock.mockRejectedValueOnce(new Error("Network error"));

    await commandCallback(mockRegion);

    expect(window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining("Could not find Job ID"));
  });
});
