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
import PersistentStorage from "../utils/PersistentStorage";
import { ProfileManagement } from "../utils/profileManagement";
import { runGetResource } from "../utils/resourceUtils";
import type { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import type { CICSTree } from "./CICSTree";

export class CICSRegionsContainer extends TreeItem {
  children: CICSRegionTree[];
  parent: CICSPlexTree;
  activeFilter: string;
  private requireDescriptionUpdate: boolean = false;

  constructor(
    parent: CICSPlexTree,
    public iconPath = getFolderIcon(false)
  ) {
    super(l10n.t("Regions"), TreeItemCollapsibleState.Collapsed);
    this.parent = parent;
    this.children = [];

    //To store the filter
    const savedFilter = PersistentStorage.getCriteria(this.buildFilterStorageKey());
    this.activeFilter = savedFilter || "*";
    this.updateLabelAndContext();
  }

  private buildFilterStorageKey(): string {
    return `${this.parent.getProfile().name}-${this.parent.getPlexName()}-regions-filter`;
  }

  private updateLabelAndContext(): void {
    this.setLabel(l10n.t("Regions"));
    this.contextValue = `cicsregionscontainer.${this.activeFilter !== "*" ? "FILTERED" : ""}`;
  }

  public async filterRegions(pattern: string, _tree: CICSTree) {
    this.activeFilter = pattern;
    this.updateLabelAndContext();
    await PersistentStorage.setCriteria(this.buildFilterStorageKey(), pattern === "*" ? undefined : pattern);

    await window.withProgress(
      {
        title: l10n.t("Filtering regions"),
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async () => {
        const regionInfo = await ProfileManagement.getRegionInfoInPlex(this.parent);
        this.addRegionsUtility(regionInfo);
        this.collapsibleState = TreeItemCollapsibleState.Expanded;
        this.refreshIcon(true);
        this.updateDescription();
        if (!this.children.length) {
          window.showInformationMessage(l10n.t("No regions found for {0}", this.parent.getPlexName()));
        }
      }
    );
  }

  public async loadRegionsInCICSGroup(_tree: CICSTree) {
    const parentPlex = this.getParent();
    const plexProfile = parentPlex.getProfile();
    const regionsObtained = await runGetResource({
      profileName: plexProfile.name,
      resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
      cicsPlex: plexProfile.profile.cicsPlex,
      regionName: plexProfile.profile.regionName,
    });
    const regionsArray = toArray(regionsObtained.response.records.cicsmanagedregion);
    this.addRegionsUtility(regionsArray);
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
    this.refreshIcon(true);
    this.updateDescription();
  }

  public async loadRegionsInPlex() {
    const parentPlex = this.getParent();
    const regionInfo = await ProfileManagement.getRegionInfoInPlex(parentPlex);
    if (regionInfo) {
      this.addRegionsUtility(regionInfo);
      this.collapsibleState = TreeItemCollapsibleState.Expanded;
      this.refreshIcon(true);
      this.updateDescription();
    }
  }
  public refreshIcon(folderOpen: boolean = false): void {
    this.iconPath = getFolderIcon(folderOpen);
  }

  /**
   * Count the number of total and active regions
   * @param regionsArray
   */
  private addRegionsUtility(regionsArray: any[]) {
    this.children = [];

    const parentPlex = this.getParent();
    const regionFilterRegex = this.activeFilter && this.activeFilter !== "*" ? new RegExp(this.patternIntoRegex(this.activeFilter)) : null;

    for (const region of regionsArray) {
      // If region filter exists then match it
      if (!regionFilterRegex || region.cicsname.match(regionFilterRegex)) {
        const newRegionTree = new CICSRegionTree(region.cicsname, region, parentPlex.getParent(), parentPlex, this);
        this.children.push(newRegionTree);
      }
    }
  }

  private patternIntoRegex(pattern: string) {
    const patternList = pattern.split(",");
    let patternString = "";
    for (const index in patternList) {
      patternString += `(^${patternList[index].trim().replace(/\*/g, "(.*)")})`;
      if (parseInt(index) !== patternList.length - 1) {
        patternString += "|";
      }
    }
    return patternString;
  }

  public async getChildren(): Promise<CICSRegionTree[]> {
    if (this.requireDescriptionUpdate) {
      this.requireDescriptionUpdate = false;
      return this.children;
    }

    const parentPlex = this.getParent();
    if (parentPlex.getProfile().profile.regionName && parentPlex.getProfile().profile.cicsPlex) {
      if (parentPlex.getGroupName()) {
        await this.loadRegionsInCICSGroup(this.getParent().getSessionNode().getParent());
      }
    } else {
      if (this.activeFilter === "*" || this.children.length === 0) {
        await this.loadRegionsInPlex();
      }
    }

    return this.children;
  }

  private updateDescription(): void {
    let activeCount = 0;
    const totalCount = this.children.length;

    for (const child of this.children) {
      if (child.region?.cicsstate === "ACTIVE") {
        activeCount += 1;
      }
    }

    let description = "";
    if (this.activeFilter && this.activeFilter !== "*") {
      description = `region=${this.activeFilter} `;
    }
    description += `[${activeCount}/${totalCount}]`;
    this.description = description;

    this.requireDescriptionUpdate = true;
    this.getParent().getSessionNode().getParent().refresh(this);
  }

  public setLabel(label: string) {
    this.label = label;
  }

  public getParent() {
    return this.parent;
  }

  public clearChildren() {
    this.children = [];
  }

  public getSession() {
    return this.getParent().getSession();
  }
}
