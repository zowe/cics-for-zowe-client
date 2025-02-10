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

import {
  CicsCmciConstants,
  CicsCmciRestError,
  getCache,
  getResource,
  IResourceQueryParams
} from "@zowe/cics-for-zowe-sdk";
import { Session } from "@zowe/imperative";
import { Gui, imperative, MessageSeverity, Types, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { toArray } from "./commandUtils";
import constants from "./constants";
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

  public static async getConfigInstance(): Promise<imperative.ProfileInfo> {
    const mProfileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
    return mProfileInfo;
  }

  public static formatRestClientError(error: imperative.RestClientError) {

    let errorMessage = ``;

    if (error.errorCode) {
      errorMessage = `${error.errorCode} - `;
    } else if (error.causeErrors?.code) {
      errorMessage = `${error.causeErrors.code} - `;
    }

    if (error.causeErrors?.message) {
      errorMessage += `${error.causeErrors.message}`;
    } else if (error.additionalDetails) {
      errorMessage += `${error.additionalDetails}`;
    }

    return errorMessage;
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

  public static async runGetResource({ session, resourceName, profile, params }: {
    session: Session,
    resourceName: string,
    profile?: imperative.IProfile,
    params?: { criteria?: string, parameter?: string; queryParams?: IResourceQueryParams; };
  }) {
    const { response } = await getResource(session, {
      name: resourceName,
      ...profile?.regionName && { regionName: profile.regionName },
      ...profile?.cicsPlex && { cicsPlex: profile.cicsPlex },
      ...params?.criteria && { criteria: params.criteria },
      ...params?.parameter && { parameter: params.parameter },
      ...params?.queryParams && { queryParams: params.queryParams },
    }, { failOnNoData: false, useCICSCmciRestError: true });
    return response;
  }

  public static async regionIsGroup(session: Session, profile: imperative.IProfile): Promise<boolean> {

    let isGroup = false;
    try {
      const { resultsummary } = await this.runGetResource({
        session,
        resourceName: CicsCmciConstants.CICS_CMCI_REGION_GROUP,
        profile,
        params: { criteria: `GROUP=${profile.regionName}`, queryParams: { summonly: true, nodiscard: false } }
      });

      isGroup = resultsummary.recordcount !== "0";
    } catch (error) {
      let errorMessage = `Error requesting region groups - ${JSON.stringify(error)}`;
      if (error instanceof CicsCmciRestError) {
        errorMessage = `${error.RESPONSE_1_ALT} ${error.RESPONSE_2_ALT} requesting Region groups.`;
      } else if (error instanceof imperative.ImperativeError) {
        errorMessage = `${error.errorCode} requesting Region groups.`;
      }
      Gui.showMessage(errorMessage, {
        severity: MessageSeverity.ERROR,
      });
      throw error;
    }

    return isGroup;
  }

  public static async isPlex(session: Session): Promise<string | null> {
    try {
      const { resultsummary } = await this.runGetResource({
        session,
        resourceName: CicsCmciConstants.CICS_CMCI_CICS_PLEX,
        params: {
          queryParams: {
            summonly: true,
            nodiscard: true,
          }
        }
      });
      return resultsummary.api_response1 === `${CicsCmciConstants.RESPONSE_1_CODES.OK}` ? resultsummary.cachetoken : null;

    } catch (error) {

      let errorMessage = `Error requesting CICSCICSPlex`;

      if (error instanceof imperative.RestClientError) {
        if (`${error.mDetails.errorCode}` === `${constants.HTTP_ERROR_NOT_FOUND}` || `${error.errorCode}` === `${constants.HTTP_ERROR_NOT_FOUND}`) {
          // Not a failure, just means it's not a Plex
          return null;
        }
        errorMessage = this.formatRestClientError(error);
      }

      Gui.showMessage(errorMessage, {
        severity: MessageSeverity.ERROR,
      });
      throw error;
    }
  }

  public static async regionPlexProvided(session: Session, profile: imperative.IProfile): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    try {
      const { records } = await this.runGetResource({
        session,
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
        profile,
      });

      if (records?.cicsmanagedregion) {
        infoLoaded.push({
          plexname: profile.cicsPlex,
          regions: toArray(records.cicsmanagedregion),
          group: await this.regionIsGroup(session, profile),
        });
      } else {
        Gui.showMessage(`Cannot find region ${profile.regionName} in plex ${profile.cicsPlex} for profile ${profile.name}`, {
          severity: MessageSeverity.ERROR,
        });
      }
    } catch (error) {
      let errorMessage = `Error requesting CICSManagedRegion - ${JSON.stringify(error)}`;
      if (error instanceof imperative.RestClientError) {
        errorMessage = this.formatRestClientError(error);
      } else if (
        error instanceof CicsCmciRestError && (
          error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM ||
          error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA)) {
        errorMessage = `Plex ${profile.cicsPlex} and Region ${profile.regionName} not found.`;
      }
      Gui.showMessage(errorMessage, {
        severity: MessageSeverity.ERROR,
      });
      throw error;
    }

    return infoLoaded;
  }

  public static async plexProvided(session: Session, profile: imperative.IProfile): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    try {

      const { records } = await this.runGetResource({
        session,
        profile,
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
      });

      if (records?.cicsmanagedregion) {
        infoLoaded.push({
          plexname: profile.cicsPlex,
          regions: toArray(records.cicsmanagedregion),
          group: false,
        });
      } else {
        Gui.showMessage(`Cannot find plex ${profile.cicsPlex} for profile ${profile.name}`, {
          severity: MessageSeverity.ERROR,
        });
      }
    } catch (error) {
      let errorMessage = `Error requesting CICSManagedRegion - ${JSON.stringify(error)}`;
      if (
        error instanceof CicsCmciRestError && (
          error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM ||
          error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA)) {
        errorMessage = `CICSplex ${profile.cicsPlex} not found.`;
      } else if (error instanceof CicsCmciRestError) {
        errorMessage = `${error.RESPONSE_1_ALT} ${error.RESPONSE_2_ALT} requesting CICSManagedRegions.`;
      } else if (error instanceof imperative.RestClientError) {
        errorMessage = this.formatRestClientError(error);
      }
      Gui.showMessage(errorMessage, {
        severity: MessageSeverity.ERROR,
      });
      throw error;
    }

    return infoLoaded;
  }

  public static async regionProvided(session: Session, profile: imperative.IProfile): Promise<InfoLoaded[]> {

    const infoLoaded: InfoLoaded[] = [];

    try {
      const { records } = await this.runGetResource({
        session,
        profile,
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
      });

      if (records?.cicsregion) {
        infoLoaded.push({
          plexname: null,
          regions: toArray(records.cicsregion),
          group: false,
        });
      } else {
        Gui.showMessage(`Cannot find region ${profile.regionName}`, {
          severity: MessageSeverity.ERROR,
        });
      }
    } catch (error) {
      let errorMessage = `Error requesting CICSRegion - ${JSON.stringify(error)}`;
      if (
        error instanceof CicsCmciRestError && (
          error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM ||
          error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA)) {
        errorMessage = `Region ${profile.regionName} not found.`;
      } else if (error instanceof CicsCmciRestError) {
        errorMessage = `${error.RESPONSE_1_ALT} ${error.RESPONSE_2_ALT} requesting CICSRegion.`;
      } else if (error instanceof imperative.RestClientError) {
        errorMessage = this.formatRestClientError(error);
      }
      Gui.showMessage(errorMessage, {
        severity: MessageSeverity.ERROR,
      });
      throw error;
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
        Gui.showMessage(`Error retrieving cache - ${JSON.stringify(error)}`, {
          severity: MessageSeverity.ERROR,
        });
        throw error;
      }
    } else {
      try {
        const { records } = await this.runGetResource({
          session,
          resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        });
        if (records?.cicsregion) {
          infoLoaded.push({
            plexname: null,
            regions: toArray(records.cicsregion),
            group: false,
          });
        }
      } catch (error) {
        let errorMessage = `Error requesting CICSRegion - ${JSON.stringify(error)}`;
        if (error instanceof CicsCmciRestError) {
          errorMessage = `${error.RESPONSE_1_ALT} ${error.RESPONSE_2_ALT} requesting CICSRegion.`;
        } else if (error instanceof imperative.RestClientError) {
          errorMessage = this.formatRestClientError(error);
        }
        Gui.showMessage(errorMessage, {
          severity: MessageSeverity.ERROR,
        });
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
      const { resultsummary, records } = await this.runGetResource({
        session,
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
        profile: { cicsPlex: plex.getPlexName() }
      });
      if (resultsummary?.api_response1 === `${CicsCmciConstants.RESPONSE_1_CODES.OK}` && records?.cicsmanagedregion) {
        return toArray(records.cicsmanagedregion);
      }
    } catch (error) {
      let errorMessage = `Error requesting CICSManagedRegion - ${JSON.stringify(error)}`;
      if (error instanceof CicsCmciRestError) {
        if (error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.NOTAVAILABLE) {
          return [];
        }
        errorMessage = `${error.RESPONSE_1_ALT} ${error.RESPONSE_2_ALT} requesting CICSManagedRegion.`;
      } else if (error instanceof imperative.RestClientError) {
        errorMessage = this.formatRestClientError(error);
      }
      Gui.showMessage(errorMessage, {
        severity: MessageSeverity.ERROR,
      });
      throw error;
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
      const { response } = await getResource(session, {
        name: resourceName,
        cicsPlex: plexName,
        ...group ? { regionName: group } : {},
        criteria: criteria,
        queryParams: {
          summonly: true,
          nodiscard: true,
          overrideWarningCount: true,
        }
      }, { failOnNoData: false, useCICSCmciRestError: true });
      if (response.resultsummary.api_response1 === `${CicsCmciConstants.RESPONSE_1_CODES.OK}`) {
        const resultsSummary = response.resultsummary;
        return { cacheToken: resultsSummary.cachetoken, recordCount: parseInt(resultsSummary.recordcount, 10) };
      }
    } catch (error) {
      if (!(error instanceof CicsCmciRestError) || error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.NODATA) {
        throw error;
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
