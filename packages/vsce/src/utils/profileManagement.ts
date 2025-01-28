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

import { getCache, getResource } from "@zowe/cics-for-zowe-sdk";
import { Session } from "@zowe/imperative";
import { imperative, Types, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import { window } from "vscode";
import { xml2json } from "xml-js";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { toArray } from "./commandUtils";
import constants from "./constants";
import cicsProfileMeta from "./profileDefinition";
import { SessConstants } from "@zowe/imperative";

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
      type: profile.useMFA ? SessConstants.AUTH_TYPE_TOKEN : SessConstants.AUTH_TYPE_BASIC,
      storeCookie: profile.useMFA,
      tokenType: profile.useMFA ? SessConstants.TOKEN_TYPE_LTPA : null,
      user: profile.user,
      password: profile.password,
      rejectUnauthorized: 'rejectUnauthorized' in profile ? profile.rejectUnauthorized : true,
    });
  }

  public static async regionIsGroup(session: Session, profile: imperative.IProfile): Promise<boolean> {

    let isGroup = false;
    try {
      const checkIfSystemGroup = await getResource(session, {
        name: "CICSRegionGroup",
        cicsPlex: profile.cicsPlex,
        regionName: profile.regionName,
        criteria: `GROUP=${profile.regionName}`,
      });
      if (checkIfSystemGroup && checkIfSystemGroup.response.resultsummary.recordcount !== "0") {
        isGroup = true;
      }
    } catch (error) {
      if (error instanceof imperative.ImperativeError) {
        if (!error.mDetails.msg.toUpperCase().includes("NODATA")) {
          throw error;
        }
      }
    }

    return isGroup;
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
        window.showErrorMessage(
          `${error.causeErrors.code} - ${error.causeErrors.message}`,
        );
      } else {
        window.showErrorMessage(
          `Error getting CICSCICSPlex resource - ${JSON.stringify(error)}`,
        );
      }
      throw error;
    }
  }

  public static async regionPlexProvided(session: Session, profile: imperative.IProfile): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    try {
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
    } catch (error) {
      if (error instanceof imperative.RestClientError) {
        window.showErrorMessage(
          `${error.causeErrors.code} - ${error.causeErrors.message}`,
        );
      } else if (error instanceof imperative.ImperativeError && (
        error.mDetails.msg.toUpperCase().includes("INVALIDATA") || error.mDetails.msg.toUpperCase().includes("INVALIDPARM"))) {
        window.showErrorMessage(
          `Plex ${profile.cicsPlex} and Region ${profile.regionName} not found - ${JSON.stringify(error)}`,
        );
      } else {
        window.showErrorMessage(
          `Error getting CICSManagedRegion resource - ${JSON.stringify(error)}`,
        );
      }
      throw error;
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
      try {
        const { response } = await getCache(session, { cacheToken: isPlex, nodiscard: false });
        if (response.records.cicscicsplex) {
          for (const plex of toArray(response.records.cicscicsplex)) {
            infoLoaded.push({
              plexname: plex.plexname,
              regions: [],
              group: false,
            });
          }
        }
      } catch (error) {
        window.showErrorMessage(
          `Error retrieving cache - ${JSON.stringify(error)}`,
        );
        throw error;
      }
    } else {
      try {
        const singleRegion = await getResource(session, {
          name: "CICSRegion",
        });
        infoLoaded.push({
          plexname: null,
          regions: toArray(singleRegion.response.records.cicsregion),
          group: false,
        });
      } catch (error) {
        if (error instanceof imperative.RestClientError) {
          if (`${error.mDetails.errorCode}` === "404") {
            window.showErrorMessage(
              `CMCI Endpoint not found - ${error.mDetails.protocol}://${error.mDetails.host}:${error.mDetails.port}${error.mDetails.resource}`,
            );
          }
        } else {
          window.showErrorMessage(
            `Error making request - ${JSON.stringify(error)}`,
          );
        }
        throw error;
      }
    }

    return infoLoaded;
  }

  /**
   * Populates the info
   * @param profile
   * @returns Array of type InfoLoaded
   */
  public static async getPlexInfo(profile: imperative.IProfileLoaded, session: Session): Promise<InfoLoaded[]> {

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
  ): Promise<{ cacheToken: string; recordCount: number; }> {
    const session = this.getSessionFromProfile(profile.profile);
    try {
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
          return { cacheToken: resultsSummary.cachetoken, recordCount: parseInt(resultsSummary.recordcount, 10) };
        }
      }
    } catch (error) {
      if (error instanceof imperative.ImperativeError) {
        if (!error.mDetails.msg.toUpperCase().includes("NODATA")) {
          throw error;
        }
      }
    }
    return { cacheToken: null, recordCount: 0 };
  }

  public static async getCachedResources(
    profile: imperative.IProfileLoaded,
    cacheToken: string,
    resourceName: string,
    start = 1,
    increment = constants.RESOURCES_MAX) {
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
