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

import { imperative, ZoweExplorerApiType } from "@zowe/zowe-explorer-api";
import * as showLogsCommand from "../../../src/commands/showLogsCommand";
import { CICSTree } from "../../../src/trees";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import { doesProfileSupportConnectionType, fetchBaseProfileWithoutError, findRelatedZosProfiles } from "../../../src/utils/commandUtils";
import { createProfile, getJesApiMock, getResourceMock, profile } from "../../__mocks__";

const cicsTree = new CICSTree();
const sessionTree = new CICSSessionTree(profile, cicsTree);
const regionTree = new CICSRegionTree("IYK2ZXXX", { jobid: "TheOtherJobId" }, sessionTree, undefined, sessionTree);

describe("Test suite for fetchBaseProfileWithoutError", () => {
  it("Profile with common base finds z/osmf", async () => {
    const profile = await fetchBaseProfileWithoutError(createProfile("host1.mycics", "cics", "h1", "user"));
    expect(profile?.name).toEqual("host1");
  });
  it("Profile with no common base", async () => {
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

  it("Profile with common base finds z/osmf", async () => {
    const profile = await findRelatedZosProfiles(createProfile("host1.mycics", "cics", "h1", "user"), zosProfiles);
    expect(profile).toEqual(h1z);
  });
  it("Profile with no common base finds same host z/osmf", async () => {
    const profile = await findRelatedZosProfiles(createProfile("mycics", "cics", "h1", "user"), zosProfiles);
    expect(profile).toEqual(h1z);
  });
  it("Profile with only RSE and same host picks RSE", async () => {
    const profile = await findRelatedZosProfiles(createProfile("host4.mycics", "cics", "h4", "user"), zosProfiles);
    expect(profile).toEqual(h4);
  });
  it("Profile with common base and different host picks connection anyway (unlikely to be a real situation)", async () => {
    const profile = await findRelatedZosProfiles(createProfile("host4.mycics", "cics", "h1", "user"), zosProfiles);
    expect(profile).toEqual(h4);
  });

  it("Profile without user is not offered automatically", async () => {
    const profile = await findRelatedZosProfiles(createProfile("host6", "cics", "h6", "user"), zosProfiles);
    expect(profile).toBeNull;
  });
});

describe("Test suite for getJobIdForRegion", () => {
  it("Job ID is available on region tree", async () => {
    let region: CICSRegionTree = regionTree;
    region.region = { jobid: "TheJobId" };

    const jobId = await showLogsCommand.getJobIdForRegion(region);
    expect(jobId).toEqual("TheJobId");
  });
  it("Job ID isn't available on region tree", async () => {
    getResourceMock.mockResolvedValueOnce({
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
    getResourceMock.mockImplementationOnce(() => {
      throw new Error("getResource failed. Perhaps your network connection has gone down");
    });

    let region: CICSRegionTree = regionTree;
    region.region.jobid = null;
    const jobId = await showLogsCommand.getJobIdForRegion(region);
    expect(jobId).toEqual(null);
  });
});

describe("Check whether profile supports JES", () => {
  it("connection supports JES", async () => {
    const supports = createProfile("host1.myzosmf", "zosmf", "h1", "user");

    expect(doesProfileSupportConnectionType(supports, ZoweExplorerApiType.Jes)).toEqual(true);
    expect(getJesApiMock).toHaveBeenCalledWith(supports);
  });
  it("connection doesn't support JES", async () => {
    const doesntSupport = createProfile("host1.myzosmf", "else", "h1", "user");

    getJesApiMock.mockImplementationOnce(() => {
      throw new Error("hello");
    });

    expect(doesProfileSupportConnectionType(doesntSupport, ZoweExplorerApiType.Jes)).toEqual(false);
    expect(getJesApiMock).toHaveBeenCalledWith(doesntSupport);
  });
});
