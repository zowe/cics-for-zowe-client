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

import { IResource } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { ProgressLocation, TreeItem, TreeItemCollapsibleState, window, workspace } from "vscode";
import IResourceMeta from "../../doc/IResourceMeta";
import { toEscapedCriteriaString } from "../../utils/filterUtils";
import { ProfileManagement } from "../../utils/profileManagement";
import { CICSPlexTree } from "../CICSPlexTree";
import { CICSRegionsContainer } from "../CICSRegionsContainer";
import { CICSRegionTree } from "../CICSRegionTree";
import { CICSTree } from "../CICSTree";
import { CICSResourceTreeItem } from "../treeItems/CICSResourceTreeItem";
import { TextTreeItem } from "../treeItems/utils/TextTreeItem";
import { getFolderIcon } from "../../utils/iconUtils";
import { ViewMore } from "../treeItems/utils/ViewMore";

export class CICSCombinedResourceTree<T extends IResource> extends TreeItem {
  children: (CICSResourceTreeItem<T> | ViewMore)[] | [TextTreeItem] | null;
  parentPlex: CICSPlexTree;
  activeFilter: string | undefined;
  currentCount: number;
  incrementCount: number;
  resourceMeta: IResourceMeta<T>;

  constructor(parentPlex: CICSPlexTree, resourceMeta: IResourceMeta<T>, public iconPath = getFolderIcon(false)) {
    super(`All ${resourceMeta.humanReadableName}`, TreeItemCollapsibleState.Collapsed);
    this.resourceMeta = resourceMeta;
    this.contextValue = `${resourceMeta.combinedContextPrefix}.`;
    this.parentPlex = parentPlex;
    this.children = [new TextTreeItem("Use the search button to display resources", "applyfiltertext.")];
    this.activeFilter = undefined;
    this.currentCount = 0;
    this.incrementCount = +`${workspace.getConfiguration().get(
      `zowe.cics.${resourceMeta.persistentStorageAllKey}.recordCountIncrement`
    )}`;
  }

  public async loadContents(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading Resources",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {});
        let recordsCount: number;
        try {
          let criteria;
          if (this.activeFilter) {
            criteria = toEscapedCriteriaString(this.activeFilter, this.resourceMeta.filterAttribute);
          }
          let count;
          const cacheTokenInfo = await ProfileManagement.generateCacheToken(
            this.parentPlex.getProfile(),
            this.parentPlex.getPlexName(),
            this.resourceMeta.resourceName,
            criteria,
            this.getParent().getGroupName(),
          );
          if (cacheTokenInfo) {
            recordsCount = cacheTokenInfo.recordCount;
            if (recordsCount) {
              let allResources;
              if (recordsCount <= this.incrementCount) {
                allResources = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  cacheTokenInfo.cacheToken,
                  this.resourceMeta.resourceName,
                  1,
                  recordsCount,
                );
              } else {
                allResources = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  cacheTokenInfo.cacheToken,
                  this.resourceMeta.resourceName,
                  1,
                  this.incrementCount,
                );
                count = recordsCount;
              }
              this.addResourcesUtil([], allResources, count);
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
            } else {
              this.children = [];
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
              window.showInformationMessage(`No resources found`);
              this.label = `All ${this.resourceMeta.humanReadableName}${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${recordsCount}]`;
            }
          }
        } catch (error) {
          if (error instanceof imperative.ImperativeError && error.mDetails.msg.includes("NOTAVAILABLE")) {
            this.children = [];
            this.iconPath = getFolderIcon(true);
            tree._onDidChangeTreeData.fire(undefined);
            window.showInformationMessage(`No resources found`);
            this.label = `All ${this.resourceMeta.humanReadableName}${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${recordsCount}]`;
          } else {
            window.showErrorMessage(
              `Something went wrong when fetching resources - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                /(\\n\t|\\n|\\t)/gm,
                " ",
              )}`,
            );
          }
        }
      },
    );
  }

  public addResourcesUtil(newChildren: (CICSResourceTreeItem<T> | ViewMore)[], allResources: T[], count: number | undefined) {
    for (const resource of allResources) {
      const regionsContainer = this.parentPlex.children.filter((child) => child instanceof CICSRegionsContainer)?.[0];
      if (regionsContainer == null) {
        continue;
      }
      const parentRegion = regionsContainer
        .getChildren()!
        .filter((child) =>
          child instanceof CICSRegionTree &&
          child.getRegionName() === resource.eyu_cicsname)?.[0] as CICSRegionTree;
      const resourceTree = new CICSResourceTreeItem<T>(resource, this.resourceMeta, parentRegion, this);
      resourceTree.setLabel(
        resourceTree.label.toString().replace(
          `${resource[this.resourceMeta.primaryKeyAttribute as keyof T]}`,
          `${resource[this.resourceMeta.primaryKeyAttribute as keyof T]} (${resource.eyu_cicsname})`
        ));
      newChildren.push(resourceTree);
    }
    if (!count) {
      count = newChildren.length;
    }
    this.currentCount = newChildren.length;
    this.label = `All ${this.resourceMeta.humanReadableName} ${this.activeFilter ?
      `(${this.activeFilter}) ` : " "}[${this.currentCount} of ${count}]`;
    if (count !== this.currentCount) {
      newChildren.push(new ViewMore(this, Math.min(this.incrementCount, count - this.currentCount)));
    }
    this.children = newChildren;
  }

  public async addMoreCachedResources(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading more resources",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async () => {
        let criteria;
        if (this.activeFilter) {
          criteria = toEscapedCriteriaString(this.activeFilter, this.resourceMeta.filterAttribute);
        }
        const cacheTokenInfo = await ProfileManagement.generateCacheToken(
          this.parentPlex.getProfile(),
          this.parentPlex.getPlexName(),
          this.resourceMeta.resourceName,
          criteria,
          this.getParent().getGroupName(),
        );
        if (cacheTokenInfo) {
          // record count may have updated
          const recordsCount = cacheTokenInfo.recordCount;
          const count = recordsCount;
          const allResources = await ProfileManagement.getCachedResources(
            this.parentPlex.getProfile(),
            cacheTokenInfo.cacheToken,
            this.resourceMeta.resourceName,
            this.currentCount + 1,
            this.incrementCount,
          );
          if (allResources) {
            this.addResourcesUtil(
              (this.getChildren()?.filter((child) => child instanceof CICSResourceTreeItem) ?? []) as CICSResourceTreeItem<T>[],
              allResources,
              count
            );
            tree._onDidChangeTreeData.fire(undefined);
          }
        }
      },
    );
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.label = `All ${this.resourceMeta.humanReadableName}`;
    this.contextValue = `${this.resourceMeta.combinedContextPrefix}.unfiltered`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.label = `All ${this.resourceMeta.humanReadableName} (${this.activeFilter})`;
    this.contextValue = `${this.resourceMeta.combinedContextPrefix}.filtered`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getChildren() {
    return this.children ? this.children.filter((child) => !(child instanceof TextTreeItem)) : [];
  }

  public getActiveFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentPlex;
  }
}
