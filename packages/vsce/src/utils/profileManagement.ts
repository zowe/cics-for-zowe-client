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

import { getCache, getResource, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { Session } from "@zowe/imperative";
import { imperative, Types, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import { window } from "vscode";
import { xml2json } from "xml-js";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { toArray } from "./commandUtils";
import cicsProfileMeta from "./profileDefinition";

export class ProfileManagement {
  private static zoweExplorerAPI = ZoweVsCodeExtension.getZoweExplorerApi();
  private static ProfilesCache = ProfileManagement.zoweExplorerAPI.getExplorerExtenderApi().getProfilesCache();

  constructor() { }

  public static apiDoesExist() {
    if (ProfileManagement.zoweExplorerAPI) {
      return true;
    }
    return false;
  }

  public static async registerCICSProfiles() {
    await ProfileManagement.zoweExplorerAPI.getExplorerExtenderApi().initForZowe("cics", cicsProfileMeta);
  }

  public static getExplorerApis() {
    return ProfileManagement.zoweExplorerAPI;
  }

  public static getProfilesCache() {
    return ProfileManagement.ProfilesCache;
  }

  public static async profilesCacheRefresh() {
    const apiRegiser: Types.IApiRegisterClient = ProfileManagement.getExplorerApis();
    await ProfileManagement.getProfilesCache().refresh(apiRegiser);
  }

  public static async createNewProfile(formResponse: imperative.ISaveProfile) {
    await ProfileManagement.ProfilesCache.getCliProfileManager("cics")?.save(formResponse);
    await ProfileManagement.getExplorerApis().getExplorerExtenderApi().reloadProfiles();
  }

  public static async updateProfile(formResponse: imperative.IUpdateProfile) {
    const profile: imperative.IProfileUpdated = await ProfileManagement.ProfilesCache.getCliProfileManager("cics")?.update(formResponse);
    await ProfileManagement.getExplorerApis().getExplorerExtenderApi().reloadProfiles();
    return profile;
  }

  public static async deleteProfile(formResponse: imperative.IDeleteProfile) {
    await ProfileManagement.ProfilesCache.getCliProfileManager("cics")?.delete(formResponse);
    await ProfileManagement.getExplorerApis().getExplorerExtenderApi().reloadProfiles();
  }

  public static async getConfigInstance(): Promise<imperative.ProfileInfo> {
    const mProfileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
    return mProfileInfo;
  }

  public static cmciResponseXml2Json(data: string) {
    return JSON.parse(xml2json(data, { compact: true, spaces: 4 }));
  }

  public static getSessionFromProfile(profile: imperative.IProfile): Session {
    return new Session({
      protocol: profile.protocol,
      hostname: profile.host,
      port: profile.port,
      type: "basic",
      user: profile.user,
      password: profile.password,
      rejectUnauthorized: 'rejectUnauthorized' in profile ? profile.rejectUnauthorized : true,
    });
  }

  public static async regionIsGroup(session: Session, profile: imperative.IProfile): Promise<boolean> {

    let checkIfSystemGroup: ICMCIApiResponse;
    try {
      checkIfSystemGroup = await getResource(session, {
        name: "CICSRegionGroup",
        cicsPlex: profile.cicsPlex,
        regionName: profile.regionName,
        criteria: `GROUP=${profile.regionName}`,
      });
    } catch (error) {
      if (error instanceof imperative.ImperativeError) {
        if (!error.mDetails.msg.toUpperCase().includes("NODATA")) {
          throw error;
        }
      }
    }

    return checkIfSystemGroup?.response.resultsummary.recordcount !== "0";
  }

  public static async isPlex(session: Session): Promise<string | null> {
    try {
      const { response } = await getResource(session, {
        name: "CICSCICSPlex",
        queryParams: {
          summonly: true,
          nodiscard: true,
        }
      });
      return response.resultsummary.api_response1_alt === "OK" ?
        response.resultsummary.cachetoken : null;
    } catch (error) {
      if (error instanceof imperative.RestClientError) {
        if (`${error.mDetails.errorCode}` === "404") {
          return null;
        }
      }
      throw error;
    }
  }

  public static async regionPlexProvided(session: Session, profile: imperative.IProfile): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    const { response } = await getResource(session, {
      name: "CICSManagedRegion",
      cicsPlex: profile.cicsPlex,
      regionName: profile.regionName,
    });

    if (response.records?.cicsmanagedregion) {
      infoLoaded.push({
        plexname: profile.cicsPlex,
        regions: toArray(response.records.cicsmanagedregion),
        group: await this.regionIsGroup(session, profile),
      });
    } else {
      window.showErrorMessage(
        `Cannot find region ${profile.regionName} in plex ${profile.cicsPlex} for profile ${profile.name}`
      );
      throw new Error("Region Not Found");
    }

    return infoLoaded;
  }

  public static async plexProvided(session: Session, profile: imperative.IProfile): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    const { response } = await getResource(session, {
      name: "CICSManagedRegion",
      cicsPlex: profile.cicsPlex,
    });

    if (response.records?.cicsmanagedregion) {
      infoLoaded.push({
        plexname: profile.cicsPlex,
        regions: toArray(response.records.cicsmanagedregion),
        group: false,
      });
    } else {
      window.showErrorMessage(`Cannot find plex ${profile.cicsPlex} for profile ${profile.name}`);
      throw new Error("Plex Not Found");
    }

    return infoLoaded;
  }

  public static async regionProvided(session: Session, profile: imperative.IProfile): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    const { response } = await getResource(session, {
      name: "CICSRegion",
      regionName: profile.regionName,
    });

    if (response.records.cicsregion) {
      infoLoaded.push({
        plexname: null,
        regions: toArray(response.records.cicsregion),
        group: false,
      });
    } else {
      window.showErrorMessage(`Cannot find region ${profile.regionName}`);
      throw new Error("Region Not Found");
    }

    return infoLoaded;
  }

  public static async noneProvided(session: Session): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    const isPlex = await this.isPlex(session);
    if (isPlex) {
      const { response } = await getCache(session, { cacheToken: isPlex, nodiscard: false });
      // const uniqueReturnedPlexes = testIfPlexResponse.response.records.cicscicsplex.filter(
      //   (plex: any, index: number) => index ===
      // testIfPlexResponse.response.records.cicscicsplex.findIndex((found: any) =>
      // found.plexname === plex.plexname));
      for (const plex of response.records.cicscicsplex || []) {
        infoLoaded.push({
          plexname: plex.plexname,
          regions: [],
          group: false,
        });
      }
    } else {
      // TODO: Error checking!!
      const singleRegion = await getResource(session, {
        name: "CICSRegion",
      });
      infoLoaded.push({
        plexname: null,
        regions: toArray(singleRegion.response.records.cicsregion),
        group: false,
      });
    }

    return infoLoaded;
  }

  /**
   * Populates the info
   * @param profile
   * @returns Array of type InfoLoaded
   */
  public static async getPlexInfo(profile: imperative.IProfileLoaded): Promise<InfoLoaded[]> {

    const session = this.getSessionFromProfile(profile.profile);

    if (profile.profile.cicsPlex && profile.profile.regionName) {
      return this.regionPlexProvided(session, profile.profile);
    } else if (profile.profile.cicsPlex) {
      return this.plexProvided(session, profile.profile);
    } else if (profile.profile.regionName) {
      return this.regionProvided(session, profile.profile);
    } else {
      return this.noneProvided(session);
    }
  }

  /**
   * Return all the regions in a given plex
   */
  public static async getRegionInfoInPlex(plex: CICSPlexTree): Promise<any[]> {
    try {
      const session = this.getSessionFromProfile(plex.getProfile().profile);
      const { response } = await getResource(session, {
        name: "CICSManagedRegion",
        cicsPlex: plex.getPlexName(),
      });
      if (response.resultsummary.api_response1_alt === "OK") {
        return toArray(response.records.cicsmanagedregion);
      }
    } catch (error) {
      if (error instanceof imperative.ImperativeError && !error.mDetails.msg.includes("NOTAVAILABLE")) {
        window.showErrorMessage(`Error retrieving ManagedRegions for plex ${plex.getPlexName()} with profile ${plex.getParent().label} - ${error}`);
      }
    }
  }

  public static async generateCacheToken(
    profile: imperative.IProfileLoaded,
    plexName: string,
    resourceName: string,
    criteria?: string,
    group?: string
  ) {
    const session = this.getSessionFromProfile(profile.profile);
    const allProgramsResponse = await getResource(session, {
      name: resourceName,
      cicsPlex: plexName,
      ...group ? { regionName: group } : {},
      criteria: criteria,
      queryParams: {
        summonly: true,
        nodiscard: true,
        overrideWarningCount: true,
      }
    });
    if (allProgramsResponse.response.resultsummary.api_response1_alt === "OK") {
      if (allProgramsResponse.response && allProgramsResponse.response.resultsummary) {
        const resultsSummary = allProgramsResponse.response.resultsummary;
        return { cacheToken: resultsSummary.cachetoken, recordCount: resultsSummary.recordcount };
      }
    }
  }

  public static async getCachedResources(profile: imperative.IProfileLoaded, cacheToken: string, resourceName: string, start = 1, increment = 800) {
    const session = this.getSessionFromProfile(profile.profile);
    const allItemsresponse = await getCache(session, {
      cacheToken,
      startIndex: start,
      count: increment,
    });

    if (allItemsresponse.response.resultsummary.api_response1_alt === "OK") {
      if (allItemsresponse.response && allItemsresponse.response.records && allItemsresponse.response.records[resourceName.toLowerCase()]) {
        const recordAttributes = allItemsresponse.response.records[resourceName.toLowerCase()];
        return toArray(recordAttributes);
      }
    }
  }
}

export interface InfoLoaded {
  plexname: string | null;
  regions: any[];
  group: boolean;
}
