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

import { CicsCmciConstants, getCache } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import constants from "../constants/CICS.defaults";
import { IResource, IResourceMeta } from "../doc";
import { PersistentStorage } from "../utils/PersistentStorage";
import { toArray } from "../utils/commandUtils";
import { runGetResource } from "../utils/resourceUtils";
import { CICSSession } from "./CICSSession";
import { Resource } from "./Resource";

export class ResourceContainer<T extends IResource> {
  resources: Resource<T>[] | undefined;
  private criteria: string;

  private cacheToken: string | null;
  private startIndex: number;
  private fetchedAll: boolean = false;
  private numberToFetch: number;
  private totalResources: number = 0;

  private filterApplied: boolean;

  constructor(
    private resourceMeta: IResourceMeta<T>,
    private resource?: Resource<T>
  ) {
    this.resetCriteria();
    this.resetContainer();
    this.resetNumberToFetch();
  }

  getTotalResources() {
    return this.totalResources;
  }

  getMeta() {
    return this.resourceMeta;
  }

  getResource() {
    return this.resource;
  }

  getResources() {
    return this.resources;
  }

  getFetchedAll() {
    return this.fetchedAll;
  }

  setCriteria(criteria: string[]) {
    this.criteria = this.resourceMeta.buildCriteria(criteria, this.resource?.attributes);
    this.filterApplied = true;
  }

  getFilter() {
    return this.criteria;
  }

  resetContainer() {
    this.resources = [];
    this.cacheToken = null;
    this.startIndex = 1;
  }

  async resetCriteria() {
    this.criteria = await this.resourceMeta.getDefaultCriteria(this.resource?.attributes);
    this.filterApplied = false;
  }

  isFilterApplied() {
    return this.filterApplied;
  }

  setNumberToFetch(num: number) {
    this.numberToFetch = num;
  }

  async resetNumberToFetch() {
    this.numberToFetch = await PersistentStorage.getNumberOfResourcesToFetch();
  }

  async loadResources(cicsSession: CICSSession, regionName: string, cicsplexName?: string): Promise<[Resource<T>[], boolean]> {
    // If we don't yet have a cacheToken, get one
    if (!this.cacheToken) {
      const cacheResponse = await runGetResource({
        session: cicsSession,
        resourceName: this.resourceMeta.resourceName,
        cicsPlex: cicsplexName,
        regionName,
        params: {
          criteria: this.criteria,
          queryParams: {
            summonly: true,
            nodiscard: true,
            overrideWarningCount: true,
          },
        },
      });

      this.fetchedAll = false;

      if (parseInt(cacheResponse.response.resultsummary.api_response1) === CicsCmciConstants.RESPONSE_1_CODES.NODATA) {
        this.cacheToken = null;
        this.fetchedAll = true;
        return [[], !this.fetchedAll];
      }
      this.cacheToken = cacheResponse.response.resultsummary.cachetoken;
      this.totalResources = parseInt(cacheResponse.response.resultsummary.recordcount);
    }

    try {
      // Retrieve a set of results from the cache
      const { response } = await getCache(
        cicsSession,
        {
          cacheToken: this.cacheToken,
          startIndex: this.startIndex,
          count: this.numberToFetch,
          nodiscard: true,
          summonly: false,
        },
        {
          failOnNoData: false,
          useCICSCmciRestError: true,
        }
      );

      // Find out if there are more resources to fetch later
      this.startIndex += this.numberToFetch;
      if (this.startIndex > parseInt(response.resultsummary.recordcount)) {
        this.fetchedAll = true;
        await getCache(cicsSession, { cacheToken: this.cacheToken, nodiscard: false, summonly: true });
      }

      const currentResources = this.resources;
      const newResources = toArray(response.records[this.resourceMeta.resourceName.toLowerCase()]).map((res: T) => new Resource(res));

      this.resources = [...currentResources, ...newResources];
    } catch (error) {
      if (
        error instanceof imperative.RestClientError &&
        // errorCode doc'd as string but is number
        parseInt(`${error.errorCode}`) === constants.HTTP_ERROR_NOT_FOUND &&
        error.message.includes("The result cache token could not be found")
      ) {
        // Request is okay but cache not present. Regenerate cache and calculate how many resources to get
        // to 'roughly' make the tree back to the same size [length of tree without newly added resources + pagination count]
        this.cacheToken = null;
        this.startIndex = 1;
        this.numberToFetch = this.resources.length + this.numberToFetch;
        this.resources = [];
        return this.loadResources(cicsSession, regionName, cicsplexName);
      }
      throw error;
    }

    return [this.resources, !this.fetchedAll];
  }
}
