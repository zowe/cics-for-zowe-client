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
import { l10n, ProgressLocation, TreeItem, TreeItemCollapsibleState, window } from "vscode";
import { toArray } from "../utils/commandUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { ProfileManagement } from "../utils/profileManagement";
import { runGetResource } from "../utils/resourceUtils";
import { createFilterRegex } from "../utils/patternUtils";
import type { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSErrorHandler } from "../errors/CICSErrorHandler";
import { CICSExtensionError } from "../errors/CICSExtensionError";

export class CICSRegionsContainer extends TreeItem {
  children: CICSRegionTree[];
  parent: CICSPlexTree;
  activeFilter: string;
  private requireDescriptionUpdate = false;

  /**
   * Creates a new CICSRegionsContainer
   * @param parent - The parent CICSPlexTree node
   * @param savedFilter - Optional saved filter from previous session
   * @param iconPath - Optional icon path for the container
   */
  constructor(
    parent: CICSPlexTree,
    savedFilter?: string,
    public iconPath = getFolderIcon(false)
  ) {
    super(l10n.t("Regions"), TreeItemCollapsibleState.Collapsed);
    this.parent = parent;
    this.children = [];

    const profile = parent.getProfile().profile;
    if (parent.getGroupName()) {
      this.activeFilter = "*";
    } else {
      const configFilter = profile.cicsPlex && profile.regionName ? profile.regionName : "*";
      this.activeFilter = savedFilter || configFilter;
    }
    this.updateLabelAndContext();
  }

  private updateLabelAndContext(): void {
    this.setLabel(l10n.t("Regions"));
    this.contextValue = `cicsregionscontainer.${this.activeFilter !== "*" ? "FILTERED" : ""}`;
  }

  /**
   * Filters regions based on a pattern (supports wildcards and comma-separated patterns)
   * @param pattern - Filter pattern (e.g., "CICS*", "CICS1,TEST*", or "*" for all)
   */
  public async filterRegions(pattern: string) {
    this.activeFilter = pattern;
    // Save the filter to the parent plex so it persists across tree rebuilds
    this.parent.saveRegionFilter(pattern);
    this.updateLabelAndContext();

    await window.withProgress(
      {
        title: l10n.t("Filtering regions"),
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async () => {
        try {
          const regionInfo = await ProfileManagement.getRegionInfoInPlex(this.parent);
          const { regions, apiResponse } = regionInfo;

          if (apiResponse) {
            CICSErrorHandler.handleErrorIfPresent(apiResponse, CicsCmciConstants.DOC_RESOURCE_TYPE_GET, this.parent.getProfile().name);
          }

          this.addRegionsUtility(regions);
          this.collapsibleState = TreeItemCollapsibleState.Expanded;
          this.refreshIcon(true);
          this.updateDescription();
          if (!this.children.length) {
            window.showInformationMessage(l10n.t("No regions found for {0}", this.parent.getPlexName()));
          }
        } catch (error) {
          this.children = [];
          this.collapsibleState = TreeItemCollapsibleState.Collapsed;
          this.refreshIcon(false);
          CICSErrorHandler.handleCMCIRestError(
            new CICSExtensionError({
              baseError: error as Error | Record<string, unknown>,
              profileName: this.parent.getProfile().name,
              resourceName: "regions",
              errorMessage: l10n.t("Failed to filter regions"),
            })
          );
        }
      }
    );
  }

  /**
   * Loads regions for a CICS group (when groupName is specified in profile)
   */
  public async loadRegionsInCICSGroup() {
    try {
      const parentPlex = this.parent;
      const plexProfile = parentPlex.getProfile();
      const regionsObtained = await runGetResource({
        profileName: plexProfile.name,
        resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
        cicsPlex: plexProfile.profile.cicsPlex,
        regionName: plexProfile.profile.regionName,
      });
      CICSErrorHandler.handleErrorIfPresent(regionsObtained, CicsCmciConstants.DOC_RESOURCE_TYPE_GET, plexProfile.name);

      const regionsArray = toArray(regionsObtained.response.records.cicsmanagedregion);
      this.addRegionsUtility(regionsArray);
      this.collapsibleState = TreeItemCollapsibleState.Expanded;
      this.refreshIcon(true);
      this.updateDescription();
    } catch (error) {
      this.children = [];
      this.collapsibleState = TreeItemCollapsibleState.Collapsed;
      this.refreshIcon(false);
      if (error instanceof CICSExtensionError) {
        CICSErrorHandler.handleCMCIRestError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Loads all regions in the plex
   */
  public async loadRegionsInPlex() {
    try {
      const parentPlex = this.parent;
      const regionInfo = await ProfileManagement.getRegionInfoInPlex(parentPlex);
      if (!regionInfo) {
        this.children = [];
        return;
      }

      const { regions, apiResponse } = regionInfo;
      if (apiResponse) {
        CICSErrorHandler.handleErrorIfPresent(apiResponse, CicsCmciConstants.DOC_RESOURCE_TYPE_GET, parentPlex.getProfile().name);
      }

      if (regions) {
        this.addRegionsUtility(regions);
        this.collapsibleState = TreeItemCollapsibleState.Expanded;
        this.refreshIcon(true);
        this.updateDescription();
      }
    } catch (error) {
      this.children = [];
      this.collapsibleState = TreeItemCollapsibleState.Collapsed;
      this.refreshIcon(false);
      CICSErrorHandler.handleCMCIRestError(
        new CICSExtensionError({
          baseError: error as Error | Record<string, unknown>,
          profileName: this.parent.getProfile().name,
          resourceName: "regions",
          errorMessage: l10n.t("Failed to load regions in CICSplex"),
        })
      );
    }
  }
  /**
   * Updates the folder icon based on open/closed state
   * @param folderOpen - Whether the folder should appear open
   */
  public refreshIcon(folderOpen = false): void {
    this.iconPath = getFolderIcon(folderOpen);
  }

  private addRegionsUtility(regionsArray: any[]) {
    this.children = [];

    const parentPlex = this.parent;
    const regionFilterRegex = createFilterRegex(this.activeFilter);

    for (const region of regionsArray) {
      if (!regionFilterRegex || region.cicsname.match(regionFilterRegex)) {
        const newRegionTree = new CICSRegionTree(region.cicsname, region, parentPlex.getParent(), parentPlex, this);
        this.children.push(newRegionTree);
      }
    }
  }

  /**
   * Gets the child region nodes, loading them if necessary
   * @returns Array of CICSRegionTree nodes
   */
  public async getChildren(): Promise<CICSRegionTree[]> {
    if (this.requireDescriptionUpdate) {
      this.requireDescriptionUpdate = false;
      return this.children;
    }

    const parentPlex = this.parent;
    const shouldLoadRegions = this.activeFilter !== "*" || this.children.length === 0;

    if (parentPlex.getProfile().profile.regionName && parentPlex.getProfile().profile.cicsPlex) {
      if (parentPlex.getGroupName()) {
        await this.loadRegionsInCICSGroup();
      } else if (shouldLoadRegions) {
        await this.loadRegionsInPlex();
      }
    } else if (shouldLoadRegions) {
      await this.loadRegionsInPlex();
    }

    return this.children;
  }

  private updateDescription(): void {
    let activeCount = 0;
    const totalCount = this.children.length;

    for (const child of this.children) {
      if (child.region?.cicsstate === "ACTIVE") {
        activeCount++;
      }
    }

    let description = "";
    // region groups
    if (!this.parent.getGroupName() && this.activeFilter && this.activeFilter !== "*") {
      description = `region=${this.activeFilter} `;
    }
    description += `[${activeCount}/${totalCount}]`;
    this.description = description;

    this.requireDescriptionUpdate = true;
    this.parent.getSessionNode().getParent().refresh(this);
  }

  /**
   * Sets the label for this container
   * @param label - The new label text
   */
  public setLabel(label: string) {
    this.label = label;
  }

  /**
   * Gets the parent plex node
   * @returns The parent CICSPlexTree
   */
  public getParent() {
    return this.parent;
  }

  /**
   * Clears all child region nodes
   */
  public clearChildren() {
    this.children = [];
  }

  public getSession() {
    return this.parent.getSession();
  }
}
