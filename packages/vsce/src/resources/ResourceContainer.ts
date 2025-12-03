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

import { IResource, IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
import { ICMCIResponseResultSummary } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { IContainedResource, IResourceMeta } from "../doc";
import { CICSErrorHandler } from "../errors/CICSErrorHandler";
import PersistentStorage from "../utils/PersistentStorage";
import { toArray } from "../utils/commandUtils";
import { runGetCache, runGetResource } from "../utils/resourceUtils";
import { Resource } from "./Resource";

export class ResourceContainer {
  private summaries: Map<IResourceMeta<IResource>, ICMCIResponseResultSummary> = new Map();
  private nextIndex: Map<IResourceMeta<IResource>, number> = new Map();
  private typeCriteria: Map<IResourceMeta<IResource>, string> = new Map();

  private pageSize: number = PersistentStorage.getNumberOfResourcesToFetch();
  private criteriaApplied: boolean;

  constructor(
    private resourceTypes: IResourceMeta<IResource>[],
    private context: IResourceProfileNameInfo,
    private parentResource?: Resource<IResource>
  ) {
    this.resetCriteria();
  }

  resetCriteria() {
    for (const type of this.resourceTypes) {
      this.typeCriteria.set(type, type.getDefaultCriteria(this.parentResource?.attributes));
    }
    this.criteriaApplied = false;
  }

  setCriteria(criteria: string[]) {
    for (const type of this.resourceTypes) {
      this.typeCriteria.set(type, type.buildCriteria(criteria, this.parentResource?.attributes));
    }
    this.criteriaApplied = true;
  }

  getCriteria(type: IResourceMeta<IResource>) {
    return this.typeCriteria.get(type);
  }

  isCriteriaApplied(): boolean {
    return this.criteriaApplied;
  }

  /**
   * Fetch region name from current object.
   */
  public getRegionName(): string {
    return this.context.regionName;
  }

  /**
   * Fetch profile name from current object.
   */
  public getProfileName(): string {
    return this.context.profileName;
  }

  /**
   * Fetch plex name from current object.
   */
  public getPlexName(): string {
    return this.context.cicsplexName;
  }

  /**
   * Retrieves and stores the summary information for each resource type, so we know how many total resources there are.
   */
  async ensureSummaries() {
    if (this.summaries.size > 0) {
      return;
    }
    for (const meta of this.resourceTypes) {
      const { response } = await runGetResource({
        cicsPlex: this.context.cicsplexName,
        profileName: this.context.profileName,
        regionName: this.context.regionName,

        resourceName: meta.resourceName,
        params: {
          criteria: this.typeCriteria.get(meta),
          queryParams: {
            nodiscard: true,
            summonly: true,
            overrideWarningCount: true, // OK as summary only
          },
        },
      });

      this.summaries.set(meta, response.resultsummary);
      this.nextIndex.set(meta, 1);
    }
  }

  /**
   * @returns How many of each resource type are remaining to fetch
   */
  private getAvailableResourceTypes(): { meta: IResourceMeta<IResource>; remaining: number }[] {
    const available: { meta: IResourceMeta<IResource>; remaining: number }[] = [];

    for (const meta of this.resourceTypes) {
      const summary = this.summaries.get(meta);
      if (!summary) {
        continue;
      }
      const start = this.nextIndex.get(meta) ?? 1;
      const left = parseInt(summary.recordcount) - (start - 1);
      if (left > 0) {
        available.push({ meta, remaining: left });
      }
    }
    return available;
  }

  /**
   * Calculates how many of each resource to fetch per page, based on total record counts
   * @param available How many of each resource type are remaining to fetch
   * @param pageSize The total allowed page size when all resource types combined.
   * @returns How many of each resource type to fetch on the next request.
   */
  private calculateAllocations(
    available: { meta: IResourceMeta<IResource>; remaining: number }[],
    pageSize: number
  ): Map<IResourceMeta<IResource>, number> {
    const totalRemaining = available.reduce((acc, v) => acc + v.remaining, 0);
    const allocations: Map<IResourceMeta<IResource>, number> = new Map();

    for (const entry of available) {
      const proportion = entry.remaining / totalRemaining;
      const share = Math.floor(pageSize * proportion);
      allocations.set(entry.meta, share);
    }

    const allocated = Array.from(allocations.values()).reduce((a, b) => a + b, 0);
    let leftover = pageSize - allocated;

    for (const entry of available) {
      if (leftover <= 0) {
        break;
      }
      const already = allocations.get(entry.meta) ?? 0;
      const extra = Math.min(leftover, entry.remaining - already);
      allocations.set(entry.meta, already + extra);
      leftover -= extra;
    }
    return allocations;
  }

  /**
   * Uses the stored cache token to get a page of each resource type, totalling the max page size.
   * @param allocations How many of each resource type to fetch
   * @returns List of ContainedResources
   */
  private async fetchRecordsForAllocations(allocations: Map<IResourceMeta<IResource>, number>): Promise<IContainedResource<IResource>[]> {
    const results: IContainedResource<IResource>[] = [];

    for (const [meta, count] of allocations.entries()) {
      if (count <= 0) {
        continue;
      }

      const summary = this.summaries.get(meta);
      const start = this.nextIndex.get(meta) ?? 1;

      const { response } = await runGetCache({
        profileName: this.context.profileName,
        cacheToken: summary.cachetoken,
        startIndex: start,
        count,
      });

      // Invalidate cache if we've retrieved everything
      if (parseInt(summary.recordcount) < start + count) {
        await runGetCache(
          {
            profileName: this.context.profileName,
            cacheToken: summary.cachetoken,
          },
          {
            nodiscard: false,
            summonly: true,
          }
        );
      }

      results.push(
        ...toArray(response.records[meta.resourceName.toLowerCase()]).map((r: IResource) => {
          {
            return { meta, resource: new Resource(r) };
          }
        })
      );
      this.nextIndex.set(meta, start + count);
    }
    return results;
  }

  /**
   * Retrieves the resource summaries for each resource type, and fetches an evenly distributed page size of each, totaling
   * the page size limit.
   * @returns List of ContainedResources
   */
  async fetchNextPage(): Promise<IContainedResource<IResource>[]> {
    let allocations = new Map();
    try {
      await this.ensureSummaries();
      const available = this.getAvailableResourceTypes();
      if (available.length === 0) {
        return [];
      }
      allocations = this.calculateAllocations(available, this.pageSize);
    } catch (error) {
      CICSErrorHandler.handleCMCIRestError(error);
    }
    return this.fetchRecordsForAllocations(allocations);
  }

  /**
   * @returns If the fetcher has more resources to fetch
   */
  hasMore(): boolean {
    for (const [meta, summary] of this.summaries.entries()) {
      const next = this.nextIndex.get(meta) ?? 1;
      if (next <= parseInt(summary.recordcount)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @returns The constructed progress string of this resource fetcher [eg. 250 of 541]
   */
  getProgress(): string | undefined {
    let fetched = 0;
    let total = 0;
    for (const [meta, summary] of this.summaries.entries()) {
      total += parseInt(summary.recordcount);
      const next = this.nextIndex.get(meta) ?? 1;
      const safeFetched = Math.min(parseInt(summary.recordcount), next - 1);
      fetched += safeFetched;
    }
    return l10n.t("{0} of {1}", fetched, total);
  }

  /**
   * Resets the fetcher
   */
  reset() {
    this.summaries.clear();
    this.nextIndex.clear();
  }
}
