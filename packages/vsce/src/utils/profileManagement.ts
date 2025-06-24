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

import { ZoweVsCodeExtension, imperative } from "@zowe/zowe-explorer-api";
import { window } from "vscode";
import cicsProfileMeta from "./profileDefinition";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { getCache, getResource } from "@zowe/cics-for-zowe-sdk";

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
    const apiRegiser = ProfileManagement.getExplorerApis();
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

  public static getSessionFromProfile(profile: imperative.IProfile): imperative.Session {
    return new imperative.Session({
      protocol: profile.protocol,
      hostname: profile.host,
      port: profile.port,
      type: "basic",
      user: profile.user,
      password: profile.password,
      rejectUnauthorized: 'rejectUnauthorized' in profile ? profile.rejectUnauthorized : true,
    });
  }


  /**
     * Populates the info
     * @param profile
     * @returns Array of type InfoLoaded
     */
  public static async getPlexInfo(profile: imperative.IProfileLoaded): Promise<InfoLoaded[]> {
    const infoLoaded: InfoLoaded[] = [];
    const session = ProfileManagement.getSessionFromProfile(profile.profile);

    if (profile.profile.cicsPlex) {
      if (profile.profile.regionName) {
        /**
         * Both Supplied, no searching required - Only load 1 region
         */
        let isGroup = false;
        try {
          const regionGroupJson = await getResource(session, {
            name: "CICSRegionGroup",
            cicsPlex: profile.profile.cicsPlex,
            regionName: profile.profile.regionName,
            criteria: "GROUP=" + profile.profile.regionName,
          });
          isGroup = regionGroupJson.response.resultsummary.recordcount !== "0";
        } catch (error) {
          console.log(error);
        }
        const managedRegionsJson = await getResource(session, {
          name: "CICSManagedRegion",
          cicsPlex: profile.profile.cicsPlex,
          regionName: profile.profile.regionName,
        });
        const allRegions = managedRegionsJson.response.records.cicsmanagedregion;

        if (allRegions) {
          infoLoaded.push({
            plexname: profile.profile.cicsPlex,
            regions: [allRegions],
            group: isGroup,
          });
        }

      } else {
        /**
         * Plex given - must search for regions
         */
        const managedRegionsJson = await getResource(session, {
          name: "CICSManagedRegion",
          cicsPlex: profile.profile.cicsPlex,
        });
        const allRegions = managedRegionsJson.response.records.cicsmanagedregion;
        infoLoaded.push({
          plexname: profile.profile.cicsPlex,
          regions: allRegions,
          group: false,
        });

      }
    } else {
      if (profile.profile.regionName) {
        /**
         * Region but no plex - Single region system, use that
         */
        const singleRegionJson = await getResource(session, {
          name: "CICSRegion",
          regionName: profile.profile.regionName,
        });
        if (singleRegionJson.response.records.cicsregion) {
          infoLoaded.push({
            plexname: null,
            regions: [singleRegionJson.response.records?.cicsregion],
            group: false,
          });
        } else {
          window.showErrorMessage(`Cannot find region ${profile.profile.regionName} for profile ${profile.name}`);
          throw new Error("Region Not Found");
        }
      } else {
        /**
         * Nothing given - Test if plex and find all info
         */
        try {
          // Plex
          const cicsplexJson = await getResource(session, {
            name: "CICSCICSPlex",
          });
          if (cicsplexJson.response.records?.cicscicsplex) {
            const returnedPlexes = cicsplexJson.response.records.cicscicsplex;
            const uniqueReturnedPlexes = returnedPlexes.filter(
              (plex: any, index: number) => index === returnedPlexes.findIndex((found: any) => found.plexname === plex.plexname)
            );
            for (const plex of uniqueReturnedPlexes) {
              // Regions are empty because we only load Plex when session is expanded
              infoLoaded.push({
                plexname: plex.plexname,
                regions: [],
                group: false,
              });
            }
          } else {
            // Not Plex
            const singleRegionJson = await getResource(session, {
              name: "CICSRegion",
            });
            const returnedRegion = singleRegionJson.response.records?.cicsregion;
            if (returnedRegion) {
              infoLoaded.push({
                plexname: null,
                regions: [returnedRegion],
                group: false,
              });
            }
          }
        } catch (error) {
          // Not Plex - Could be error
          const singleRegionJson = await getResource(session, {
            name: "CICSRegion",
          });
          const returnedRegion = singleRegionJson.response.records?.cicsregion;
          if (returnedRegion) {
            infoLoaded.push({
              plexname: null,
              regions: [returnedRegion],
              group: false,
            });
          }
        }
      }

    }
    return infoLoaded;
  }

  /**
     * Return all the regions in a given plex
     */
  public static async getRegionInfoInPlex(plex: CICSPlexTree) {
    try {
      const session = ProfileManagement.getSessionFromProfile(plex.getProfile().profile);
      const managedRegionsJson = await getResource(session, {
        name: "CICSManagedRegion",
        cicsPlex: plex.getPlexName(),
      });
      if (managedRegionsJson.response.records?.cicsmanagedregion != null) {
        const returnedRegions = managedRegionsJson.response.records.cicsmanagedregion;
        return returnedRegions;
      }
    } catch (error) {
      console.log(error);
      window.showErrorMessage(`Cannot find plex ${plex.getPlexName()} for profile ${plex.getParent().label}`);
      throw new Error("Plex Not Found");
    }
  }

  public static async generateCacheToken(profile: imperative.IProfileLoaded, plexName: string, resourceName: string, criteria?: string, group?: string) {
    try {
      const session = ProfileManagement.getSessionFromProfile(profile.profile);
      const allProgramsResponse = await getResource(session, {
        name: resourceName,
        cicsPlex: plexName,
        regionName: group,
        criteria: criteria,
        queryParams: {
          nodiscard: true,
          summonly: true,
          overrideWarningCount: true,
        }
      });

      if (allProgramsResponse.response?.resultsummary) {
        const resultsSummary = allProgramsResponse.response.resultsummary;
        return { cacheToken: resultsSummary.cachetoken, recordCount: resultsSummary.recordcount };
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public static async getCachedResources(profile: imperative.IProfileLoaded, cacheToken: string, resourceName: string, start = 1, increment = 800) {
    try {
      const session = ProfileManagement.getSessionFromProfile(profile.profile);
      const allItemsResponse = await getCache(session, {
        cacheToken,
        startIndex: start,
        count: increment,
        nodiscard: true,
        overrideWarningCount: true,
      });

      const recordAttributes = allItemsResponse.response?.records?.[resourceName.toLowerCase()];
      if (recordAttributes != null) {
        const recordAttributesArr = Array.isArray(recordAttributes) ? recordAttributes : [recordAttributes];
        return recordAttributesArr;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export interface InfoLoaded {
  plexname: string | null;
  regions: any[];
  group: boolean;
}
