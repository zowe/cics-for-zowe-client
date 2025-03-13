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
import { CICSplex, CICSSession, Region } from "../resources";
import CICSRequester from "./CICSRequester";
import { imperative } from "@zowe/zowe-explorer-api";
import { ICICSplex } from "../doc";
import constants from "./constants";
import { toArray } from "./commandUtils";


class STopologyBuilder {
  private static _instance: STopologyBuilder;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  private async getPlexCacheToken(session: CICSSession) {
    try {

      const { response } = await CICSRequester.get(session, {
        resourceName: CicsCmciConstants.CICS_CMCI_CICS_PLEX,
        queryParams: {
          nodiscard: true, summonly: true,
        },
      });
      return response.resultsummary.cachetoken;

    } catch (error) {
      if (
        error instanceof imperative.RestClientError &&
        (`${error.mDetails.errorCode}` === `${constants.HTTP_ERROR_NOT_FOUND}` || `${error.errorCode}` === `${constants.HTTP_ERROR_NOT_FOUND}`)
      ) {
        // Not a failure, just means it's not a Plex
        return null;
      }

      throw error;
    }
  }

  private scoreCicsPlexByStatus(plex: ICICSplex): number {
    return (plex.status === "ACTIVE" && 7) + (plex.accesstype === "LOCAL" && 5) + (plex.mpstatus === "YES" && 3);
  }

  private getBestCICSplexes(cicscicsplex: ICICSplex[]) {
    const allcicsplexes = new Map<string, ICICSplex>();
    cicscicsplex.sort((a, b) => this.scoreCicsPlexByStatus(a) - this.scoreCicsPlexByStatus(b));

    for (const plex of cicscicsplex) {
      allcicsplexes.set(plex.plexname, plex);
    }

    return allcicsplexes;
  }

  public async getTopology(
    session: CICSSession
  ): Promise<{ cicsplexes: CICSplex[]; regions: Region[]; }> {

    if (session.cicsplexName && session.regionName) {
      // Search for specific region in plex

      const { response } = await CICSRequester.get(session, {
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
        cicsplexName: session.cicsplexName,
        regionName: session.regionName,
      });

      return {
        cicsplexes: [],
        regions: toArray(response.records.cicsmanagedregion).map((reg) => new Region(reg, { plexName: session.cicsplexName, belongsToPlex: true })),
      };

    } else if (session.cicsplexName) {
      // Search for all regions in plex

      const { response } = await CICSRequester.get(session, {
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
        cicsplexName: session.cicsplexName,
      });

      return {
        cicsplexes: [],
        regions: toArray(response.records.cicsmanagedregion).map((reg) => new Region(reg, { plexName: session.cicsplexName, belongsToPlex: true })),
      };

    } else if (session.regionName) {
      // Assume SMSSJ, search for region

      const { response } = await CICSRequester.get(session, {
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        regionName: session.regionName,
      });

      return {
        cicsplexes: [],
        regions: toArray(response.records.cicsregion).map((reg) => new Region(reg, { belongsToPlex: false })),
      };

    } else {
      // Try Plexes, return if found
      // If not, search regions, return if found

      const plexCacheToken = await this.getPlexCacheToken(session);
      if (plexCacheToken) {
        const { response } = await CICSRequester.getCache(session, { cacheToken: plexCacheToken });

        if (response.records.cicscicsplex) {
          const cicscicsplexs = this.getBestCICSplexes(toArray(response.records.cicscicsplex));

          if (cicscicsplexs.size === 0) {
            return {
              cicsplexes: [],
              regions: [],
            };
          }

          return {
            cicsplexes: [...cicscicsplexs.values()].map((plex) => new CICSplex(plex)),
            regions: [],
          };
        }
      } else {
        const { response } = await CICSRequester.get(session, {
          resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        });

        if (response.records.cicsregion) {
          return {
            cicsplexes: [],
            regions: toArray(response.records.cicsregion).map((region) => new Region(region, { belongsToPlex: false })),
          };
        }
      }
    }
  }
}

const TopologyBuilder = STopologyBuilder.Instance;
export default TopologyBuilder;