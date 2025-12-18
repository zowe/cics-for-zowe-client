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
import { CICSLogger } from "../utils/CICSLogger";
import { toArray } from "../utils/commandUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { ProfileManagement } from "../utils/profileManagement";
import { runGetResource } from "../utils/resourceUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSTree } from "./CICSTree";

export class CICSRegionsContainer extends TreeItem {
  children: CICSRegionTree[];
  parent: CICSPlexTree;
  resourceFilters: any;
  activeFilter: string;
  refreshNode: boolean = false;

  constructor(
    parent: CICSPlexTree,
    public iconPath = getFolderIcon(false)
  ) {
    super(l10n.t("Regions"), TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicsregionscontainer.`;
    this.parent = parent;
    this.children = [];
    this.activeFilter = "*";
  }

  public async filterRegions(pattern: string, tree: CICSTree) {
    CICSLogger.debug(`Filter region [${pattern}]`);

    this.children = [];
    this.activeFilter = pattern;
    this.setLabel(this.activeFilter === "*" ? l10n.t("Regions") : l10n.t("Regions ({0})", this.activeFilter));
    await window.withProgress(
      {
        title: l10n.t("Filtering regions"),
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {});
        const regionInfo = await ProfileManagement.getRegionInfoInPlex(this.parent);
        this.addRegionsUtility(regionInfo);
        this.collapsibleState = TreeItemCollapsibleState.Expanded;
        this.refreshIcon(true);
        tree._onDidChangeTreeData.fire(undefined);
        if (!this.children.length) {
          window.showInformationMessage(l10n.t("No regions found for {0}", this.parent.getPlexName()));
        }
      }
    );
  }

  public async loadRegionsInCICSGroup(tree: CICSTree) {
    const parentPlex = this.getParent();
    const plexProfile = parentPlex.getProfile();
    const regionsObtained = await runGetResource({
      profileName: plexProfile.name,
      resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
      cicsPlex: plexProfile.profile.cicsPlex,
      regionName: plexProfile.profile.regionName,
    });
    this.clearChildren();
    const regionsArray = toArray(regionsObtained.response.records.cicsmanagedregion);
    this.addRegionsUtility(regionsArray);
    // Keep container open after label change
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
    this.refreshIcon(true);
    tree._onDidChangeTreeData.fire(undefined);
  }

  public async loadRegionsInPlex() {
    const parentPlex = this.getParent();
    const regionInfo = await ProfileManagement.getRegionInfoInPlex(parentPlex);
    if (regionInfo) {
      this.addRegionsUtility(regionInfo);
      // Keep container open after label change
      this.collapsibleState = TreeItemCollapsibleState.Expanded;
      this.refreshIcon(true);
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
    let activeCount = 0;
    let totalCount = 0;
    const parentPlex = this.getParent();
    //parentPlex.getActiveFilter() ? RegExp(parentPlex.getActiveFilter()!) : undefined;
    const regionFilterRegex = this.activeFilter ? new RegExp(this.patternIntoRegex(this.activeFilter)) : "";
    for (const region of regionsArray) {
      // If region filter exists then match it
      if (!regionFilterRegex || region.cicsname.match(regionFilterRegex)) {
        const newRegionTree = new CICSRegionTree(region.cicsname, region, parentPlex.getParent(), parentPlex, this);
        this.children.push(newRegionTree);
        totalCount += 1;
        if (region.cicsstate === "ACTIVE") {
          activeCount += 1;
        }
      }
    }

    this.description = `${this.activeFilter !== "*" ? l10n.t("({0}) ", this.activeFilter) : ""}${l10n.t("{0}/{1}", activeCount, totalCount)}`;
  }

  private patternIntoRegex(pattern: string) {
    const patternList = pattern.split(",");
    let patternString = "";
    for (const index in patternList) {
      patternString += `(^${patternList[index].trim().replace("*", "(.*)")})`;
      if (parseInt(index) !== patternList.length - 1) {
        patternString += "|";
      }
    }
    const regex = new RegExp(patternString);
    return regex;
  }

  public async getChildren(): Promise<CICSRegionTree[]> {
    if (this.refreshNode) {
      this.refreshNode = false;
      return this.children;
    }
    const parentPlex = this.getParent();
    if (parentPlex.getProfile().profile.regionName && parentPlex.getProfile().profile.cicsPlex) {
      if (parentPlex.getGroupName()) {
        this.clearChildren();
        await this.loadRegionsInCICSGroup(this.getParent().getSessionNode().getParent());
        this.iconPath = getFolderIcon(true);
      }
    } else {
      this.clearChildren();
      await this.loadRegionsInPlex();

      if (this.children.length === 0) {
        this.getParent().children = this.getParent().children.filter((c) => c instanceof CICSRegionsContainer);
      }

      this.getParent().refreshNode = true;
      this.refreshNode = true;
      this.getParent().getSessionNode().getParent().refresh(this.getParent());
    }

    return this.children;
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
