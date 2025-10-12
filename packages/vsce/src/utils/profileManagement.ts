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

import { CicsCmciConstants, CicsCmciRestError, getCICSProfileDefinition } from "@zowe/cics-for-zowe-sdk";
import { Gui, imperative, MessageSeverity, Types, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import constants from "../constants/CICS.defaults";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { toArray } from "./commandUtils";
import { getBestCICSplexes } from "./plexUtils";
import { runGetCache, runGetResource } from "./resourceUtils";

export class ProfileManagement {
  private static zoweExplorerAPI = ZoweVsCodeExtension.getZoweExplorerApi();
  private static ProfilesCache = ProfileManagement.zoweExplorerAPI.getExplorerExtenderApi().getProfilesCache();

  public static apiDoesExist() {
    if (ProfileManagement.zoweExplorerAPI) {
      return true;
    }
    return false;
  }

  public static async registerCICSProfiles() {
    await ProfileManagement.zoweExplorerAPI.getExplorerExtenderApi().initForZowe("cics", [getCICSProfileDefinition()]);
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

  public static async regionIsGroup(profile: imperative.IProfileLoaded): Promise<boolean> {
    let isGroup = false;
    try {
      const { response } = await runGetResource({
        profileName: profile.name,
        resourceName: CicsCmciConstants.CICS_CMCI_REGION_GROUP,
        ...(profile?.profile.regionName && { regionName: profile.profile.regionName }),
        ...(profile?.profile.cicsPlex && { cicsPlex: profile.profile.cicsPlex }),
        params: { criteria: `GROUP=${profile.profile.regionName}`, queryParams: { summonly: true, nodiscard: false } },
      });

      isGroup = response.resultsummary.recordcount !== "0";
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

  public static async isPlex(profile: imperative.IProfileLoaded): Promise<string | null> {
    try {
      const { response } = await runGetResource({
        profileName: profile.name,
        resourceName: CicsCmciConstants.CICS_CMCI_CICS_PLEX,
        params: {
          queryParams: {
            summonly: true,
            nodiscard: true,
          },
        },
      });
      return response.resultsummary.api_response1 === `${CicsCmciConstants.RESPONSE_1_CODES.OK}` ? response.resultsummary.cachetoken : null;
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

  public static async regionPlexProvided(profile: imperative.IProfileLoaded): Promise<InfoLoaded[]> {
    const infoLoaded: InfoLoaded[] = [];

    try {
      const { response } = await runGetResource({
        profileName: profile.name,
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
        ...(profile?.profile.regionName && { regionName: profile.profile.regionName }),
        ...(profile?.profile.cicsPlex && { cicsPlex: profile.profile.cicsPlex }),
      });

      if (response.records?.cicsmanagedregion) {
        infoLoaded.push({
          plexname: profile.profile.cicsPlex,
          regions: toArray(response.records.cicsmanagedregion),
          group: await this.regionIsGroup(profile),
        });
      } else {
        Gui.showMessage(`Cannot find region ${profile.profile.regionName} in plex ${profile.profile.cicsPlex} for profile ${profile.name}`, {
          severity: MessageSeverity.ERROR,
        });
      }
    } catch (error) {
      let errorMessage = `Error requesting CICSManagedRegion - ${JSON.stringify(error)}`;
      if (error instanceof imperative.RestClientError) {
        errorMessage = this.formatRestClientError(error);
      } else if (
        error instanceof CicsCmciRestError &&
        (error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM || error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA)
      ) {
        errorMessage = `Plex ${profile.profile.cicsPlex} and Region ${profile.profile.regionName} not found.`;
      }
      Gui.showMessage(errorMessage, {
        severity: MessageSeverity.ERROR,
      });
      throw error;
    }

    return infoLoaded;
  }

  public static async plexProvided(profile: imperative.IProfileLoaded): Promise<InfoLoaded[]> {
    const infoLoaded: InfoLoaded[] = [];

    try {
      const { response } = await runGetResource({
        profileName: profile.name,
        ...(profile?.profile.regionName && { regionName: profile.profile.regionName }),
        ...(profile?.profile.cicsPlex && { cicsPlex: profile.profile.cicsPlex }),
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
      });

      if (response.records?.cicsmanagedregion) {
        infoLoaded.push({
          plexname: profile.profile.cicsPlex,
          regions: toArray(response.records.cicsmanagedregion),
          group: false,
        });
      } else {
        Gui.showMessage(`Cannot find plex ${profile.profile.cicsPlex} for profile ${profile.name}`, {
          severity: MessageSeverity.ERROR,
        });
      }
    } catch (error) {
      let errorMessage = `Error requesting CICSManagedRegion - ${JSON.stringify(error)}`;
      if (
        error instanceof CicsCmciRestError &&
        (error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM || error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA)
      ) {
        errorMessage = `CICSplex ${profile.profile.cicsPlex} not found.`;
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

  public static async regionProvided(profile: imperative.IProfileLoaded): Promise<InfoLoaded[]> {
    const infoLoaded: InfoLoaded[] = [];

    try {
      const { response } = await runGetResource({
        profileName: profile.name,
        ...(profile?.profile.regionName && { regionName: profile.profile.regionName }),
        ...(profile?.profile.cicsPlex && { cicsPlex: profile.profile.cicsPlex }),
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
      });

      if (response.records?.cicsregion) {
        infoLoaded.push({
          plexname: null,
          regions: toArray(response.records.cicsregion),
          group: false,
        });
      } else {
        Gui.showMessage(`Cannot find region ${profile.profile.regionName}`, {
          severity: MessageSeverity.ERROR,
        });
      }
    } catch (error) {
      let errorMessage = `Error requesting CICSRegion - ${JSON.stringify(error)}`;
      if (
        error instanceof CicsCmciRestError &&
        (error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM || error.RESPONSE_1 === CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA)
      ) {
        errorMessage = `Region ${profile.profile.regionName} not found.`;
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

  public static async noneProvided(profile: imperative.IProfileLoaded): Promise<InfoLoaded[]> {
    const infoLoaded: InfoLoaded[] = [];

    const isPlex = await this.isPlex(profile);
    if (isPlex) {
      try {
        const { response } = await runGetCache({ profileName: profile.name, cacheToken: isPlex }, { nodiscard: false, summonly: false });
        if (response.records.cicscicsplex) {
          const cicscicsplexs = getBestCICSplexes(toArray(response.records.cicscicsplex));

          cicscicsplexs.forEach((value: {}, key: string) => {
            infoLoaded.push({
              plexname: key,
              regions: [],
              group: false,
            });
          });
        }
      } catch (error) {
        Gui.showMessage(`Error retrieving cache - ${JSON.stringify(error)}`, {
          severity: MessageSeverity.ERROR,
        });
        throw error;
      }
    } else {
      try {
        const { response } = await runGetResource({
          profileName: profile.name,
          resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        });
        if (response.records?.cicsregion) {
          infoLoaded.push({
            plexname: null,
            regions: toArray(response.records.cicsregion),
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
    if (profile.profile.cicsPlex && profile.profile.regionName) {
      return this.regionPlexProvided(profile);
    } else if (profile.profile.cicsPlex) {
      return this.plexProvided(profile);
    } else if (profile.profile.regionName) {
      return this.regionProvided(profile);
    } else {
      return this.noneProvided(profile);
    }
  }

  public static async getRegionInfoInPlex(plex: CICSPlexTree): Promise<any[]> {
    return await ProfileManagement.getRegionInfo(plex.getPlexName(), plex.getProfile());
  }
  /**
   * Return all the regions in a given plex
   */
  public static async getRegionInfo(plexName: string, profile: imperative.IProfileLoaded): Promise<any[]> {
    try {
      const { response } = await runGetResource({
        profileName: profile.name,
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
        cicsPlex: plexName,
      });
      if (response.resultsummary?.api_response1 === `${CicsCmciConstants.RESPONSE_1_CODES.OK}` && response.records?.cicsmanagedregion) {
        return toArray(response.records.cicsmanagedregion);
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
}

export interface InfoLoaded {
  plexname: string | null;
  regions: any[];
  group: boolean;
}
