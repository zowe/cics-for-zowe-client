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

import { getResource, IResource } from "@zowe/cics-for-zowe-sdk";
import { TreeItem, TreeItemCollapsibleState, window } from "vscode";
import IResourceMeta from "../doc/IResourceMeta";
import { toArray } from "../utils/commandUtils";
import { toEscapedCriteriaString } from "../utils/filterUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSResourceTreeItem } from "./treeItems/CICSResourceTreeItem";


export class CICSResourceTree<T extends IResource> extends TreeItem {
  children: CICSResourceTreeItem<T>[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  resourceMeta: IResourceMeta<T>;

  constructor(resourceMeta: IResourceMeta<T>, parentRegion: CICSRegionTree, public iconPath = getFolderIcon(false)) {
    super(resourceMeta.humanReadableName, TreeItemCollapsibleState.Collapsed);
    this.contextValue = `${resourceMeta.contextPrefix}.${this.activeFilter ? "filtered" : "unfiltered"}.${resourceMeta.resourceName}`;
    this.parentRegion = parentRegion;
    this.resourceMeta = resourceMeta;
  }

  public addResource(resource: CICSResourceTreeItem<T>) {
    this.children.push(resource);
  }

  public async loadContents() {

    let criteria = await this.resourceMeta.getDefaultFilter();
    if (this.activeFilter) {
      criteria = toEscapedCriteriaString(this.activeFilter, this.resourceMeta.filterAttribute);
    }

    this.children = [];
    try {

      const { response } = await getResource(this.parentRegion.parentSession.session, {
        name: this.resourceMeta.resourceName,
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        criteria: criteria,
      });
      const results = toArray(response.records[this.resourceMeta.resourceName.toLowerCase()]);

      this.label = `${this.resourceMeta.humanReadableName}${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${results.length}]`;

      for (const resource of results) {
        const newResourceItem = new CICSResourceTreeItem<T>(
          resource as T,
          this.resourceMeta,
          this.parentRegion,
          this,
        );
        this.addResource(newResourceItem);
      }

      this.iconPath = getFolderIcon(true);

    } catch (error) {
      if (error.mMessage?.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No ${this.resourceMeta.humanReadableName} found`);

        this.label = `${this.resourceMeta.humanReadableName}${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);

      } else {
        window.showErrorMessage(
          `Something went wrong when fetching resources - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " "
          )}`
        );
      }
    }
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.contextValue = `${this.resourceMeta.contextPrefix}.${this.activeFilter ? "filtered" : "unfiltered"}.${this.resourceMeta.resourceName}`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `${this.resourceMeta.contextPrefix}.${this.activeFilter ? "filtered" : "unfiltered"}.${this.resourceMeta.resourceName}`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentRegion;
  }
}
