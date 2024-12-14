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

  public static async getConfigInstance(): Promise<imperative.ProfileInfo> {
    const mProfileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
    return mProfileInfo;
  }

  public static cmciResponseXml2Json(data: string) {
    return JSON.parse(xml2json(data, { compact: true, spaces: 4 }));
  }

  /**
   * Populates the info
   * @param profile
   * @returns Array of type InfoLoaded
   */
  public static async getPlexInfo(profile: imperative.IProfileLoaded): Promise<InfoLoaded[]> {

    const session = new Session({
      protocol: profile.profile.protocol,
      hostname: profile.profile.host,
      port: profile.profile.port,
      type: "basic",
      user: profile.profile.user,
      password: profile.profile.password,
      rejectUnauthorized: profile.profile && 'rejectUnauthorized' in profile.profile ? profile.profile.rejectUnauthorized : true,
    });

    const infoLoaded: InfoLoaded[] = [];

    if (profile.profile.cicsPlex) {
      if (profile.profile.regionName) {
        /**
         * Both Supplied, no searching required - Only load 1 region
         */
        let checkIfSystemGroup: ICMCIApiResponse;
        try {
          checkIfSystemGroup = await getResource(session, {
            name: "CICSRegionGroup",
            cicsPlex: profile.profile.cicsPlex,
            regionName: profile.profile.regionName,
            criteria: `GROUP=${profile.profile.regionName}`,
          });
        } catch (error) {
          if (error instanceof imperative.ImperativeError) {
            if (!error.mDetails.msg.toUpperCase().includes("NODATA")) {
              throw error;
            }
          }
        }

        if (
          checkIfSystemGroup &&
          checkIfSystemGroup.response.resultsummary &&
          checkIfSystemGroup.response.resultsummary.recordcount !== "0"
        ) {
          // CICSGroup
          const singleGroupResponse = await getResource(session, {
            name: "CICSManagedRegion",
            cicsPlex: profile.profile.cicsPlex,
            regionName: profile.profile.regionName,
          });
          infoLoaded.push({
            plexname: profile.profile.cicsPlex,
            regions: toArray(singleGroupResponse.response.records.cicsmanagedregion),
            group: true,
          });
        } else {
          // Region
          const singleRegionResponse = await getResource(session, {
            name: "CICSManagedRegion",
            cicsPlex: profile.profile.cicsPlex,
            regionName: profile.profile.regionName,
          });
          if (singleRegionResponse.response.records && singleRegionResponse.response.records.cicsmanagedregion) {
            infoLoaded.push({
              plexname: profile.profile.cicsPlex,
              regions: toArray(singleRegionResponse.response.records.cicsmanagedregion),
              group: false,
            });
          } else {
            window.showErrorMessage(
              `Cannot find region ${profile.profile.regionName} in plex ${profile.profile.cicsPlex} for profile ${profile.name}`
            );
            throw new Error("Region Not Found");
          }
        }
      } else {
        /**
         * Plex given - must search for regions
         */
        const allRegionResponse = await getResource(session, {
          name: "CICSManagedRegion",
          cicsPlex: profile.profile.cicsPlex,
        });
        if (allRegionResponse.response.records && allRegionResponse.response.records.cicsmanagedregion) {
          infoLoaded.push({
            plexname: profile.profile.cicsPlex,
            regions: toArray(allRegionResponse.response.records.cicsmanagedregion),
            group: false,
          });
        } else {
          window.showErrorMessage(`Cannot find plex ${profile.profile.cicsPlex} for profile ${profile.name}`);
          throw new Error("Plex Not Found");
        }
      }
    } else {
      if (profile.profile.regionName) {
        /**
         * Region but no plex - Single region system, use that
         */
        const singleRegionResponse = await getResource(session, {
          name: "CICSRegion",
          regionName: profile.profile.regionName,
        });
        if (singleRegionResponse.response.records && singleRegionResponse.response.records.cicsregion) {
          infoLoaded.push({
            plexname: null,
            regions: toArray(singleRegionResponse.response.records.cicsregion),
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
          const testIfPlexResponse = await getResource(session, {
            name: "CICSCICSPlex",
          });
          if (testIfPlexResponse.response.resultsummary.api_response1_alt === "OK") {
            // Plex
            if (testIfPlexResponse.response.records && testIfPlexResponse.response.records.cicscicsplex) {
              const uniqueReturnedPlexes = testIfPlexResponse.response.records.cicscicsplex.filter(
                (plex: any, index: number) => index === testIfPlexResponse.response.records.cicscicsplex.findIndex((found: any) => found.plexname === plex.plexname)
              );
              for (const plex of uniqueReturnedPlexes) {
                try {
                  // Regions are empty because we only load Plex when session is expanded
                  infoLoaded.push({
                    plexname: plex.plexname,
                    regions: [],
                    group: false,
                  });
                } catch (error) {
                  console.log(error);
                }
              }
            }
          } else {
            // Not Plex
            const singleRegion = await getResource(session, {
              name: "CICSRegion",
            });
            infoLoaded.push({
              plexname: null,
              regions: toArray(singleRegion.response.records.cicsregion),
              group: false,
            });
          }
        } catch (error) {
          // Not Plex - Could be error
          try {
            const singleRegion = await getResource(session, {
              name: "CICSRegion",
            });
            infoLoaded.push({
              plexname: null,
              regions: toArray(singleRegion.response.records.cicsregion),
              group: false,
            });
          } catch (e2) {
            throw e2;
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
      const profile = plex.getProfile();

      const session = new Session({
        protocol: profile.profile.protocol,
        hostname: profile.profile.host,
        port: profile.profile.port,
        type: "basic",
        user: profile.profile.user,
        password: profile.profile.password,
        rejectUnauthorized: profile.profile && 'rejectUnauthorized' in profile.profile ? profile.profile.rejectUnauthorized : true,
      });

      const regionResponse = await getResource(session, {
        name: "CICSManagedRegion",
        cicsPlex: plex.getPlexName(),
      });
      if (regionResponse.response.resultsummary.api_response1_alt === "OK") {
        if (regionResponse.response.records && regionResponse.response.records.cicsmanagedregion) {
          return regionResponse.response.records.cicsmanagedregion;
        }
      }
    } catch (error) {
      console.log(error);
      if (error instanceof imperative.ImperativeError) {
        if (error.mDetails.msg.includes("NOTAVAILABLE")) {
          window.showErrorMessage(`No regions found for plex ${plex.getPlexName()} with profile ${plex.getParent().label}`);
          throw new Error("No regions found");
        }
      }
      window.showErrorMessage(`Error retrieving ManagedRegions for plex ${plex.getPlexName()} with profile ${plex.getParent().label}`, error.message);
      throw new Error("Error retrieving ManagedRegions");
    }
  }

  public static async generateCacheToken(profile: imperative.IProfileLoaded, plexName: string, resourceName: string, criteria?: string, group?: string) {
    try {
      const session = new Session({
        protocol: profile.profile.protocol,
        hostname: profile.profile.host,
        port: profile.profile.port,
        type: "basic",
        user: profile.profile.user,
        password: profile.profile.password,
        rejectUnauthorized: profile.profile && 'rejectUnauthorized' in profile.profile ? profile.profile.rejectUnauthorized : true,
      });
      const allProgramsResponse = await getResource(session, {
        name: resourceName,
        cicsPlex: plexName,
        ...group ? { regionName: group } : {},
        queryParams: {
          summonly: true,
          nodiscard: true,
        }
      });
      if (allProgramsResponse.response.resultsummary.api_response1_alt === "OK") {
        if (allProgramsResponse.response && allProgramsResponse.response.resultsummary) {
          const resultsSummary = allProgramsResponse.response.resultsummary;
          return { cacheToken: resultsSummary.cachetoken, recordCount: resultsSummary.recordcount };
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public static async getCachedResources(profile: imperative.IProfileLoaded, cacheToken: string, resourceName: string, start = 1, increment = 800) {
    try {
      const session = new Session({
        protocol: profile.profile.protocol,
        hostname: profile.profile.host,
        port: profile.profile.port,
        type: "basic",
        user: profile.profile.user,
        password: profile.profile.password,
        rejectUnauthorized: profile.profile && 'rejectUnauthorized' in profile.profile ? profile.profile.rejectUnauthorized : true,
      });
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
