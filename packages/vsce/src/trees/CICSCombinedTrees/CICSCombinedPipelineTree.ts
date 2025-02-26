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

import { ProgressLocation, TreeItem, TreeItemCollapsibleState, window, workspace } from "vscode";
import { toEscapedCriteriaString } from "../../utils/filterUtils";
import { ProfileManagement } from "../../utils/profileManagement";
import { CICSPlexTree } from "../CICSPlexTree";
import { CICSRegionsContainer } from "../CICSRegionsContainer";
import { CICSRegionTree } from "../CICSRegionTree";
import { CICSTree } from "../CICSTree";
import { TextTreeItem } from "../treeItems/utils/TextTreeItem";
import { getFolderIcon } from "../../utils/iconUtils";
import { ViewMore } from "../treeItems/utils/ViewMore";
import { CICSPipelineTreeItem } from "../treeItems/web/treeItems/CICSPipelineTreeItem";

export class CICSCombinedPipelineTree extends TreeItem {
  children: (CICSPipelineTreeItem | ViewMore)[] | [TextTreeItem] | null;
  parentPlex: CICSPlexTree;
  activeFilter: string | undefined;
  currentCount: number;
  incrementCount: number;
  constant: string;

  constructor(
    parentPlex: CICSPlexTree,
    public iconPath = getFolderIcon(false),
  ) {
    super("All Pipelines", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicscombinedpipelinetree.`;
    this.parentPlex = parentPlex;
    this.children = [new TextTreeItem("Use the search button to display pipelines", "applyfiltertext.")];
    this.activeFilter = undefined;
    this.currentCount = 0;
    this.incrementCount = +`${workspace.getConfiguration().get("zowe.cics.allPipelines.recordCountIncrement")}`;
    this.constant = "CICSPipeline";
  }

  public async loadContents(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading Pipelines",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {});
        try {
          let criteria;
          if (this.activeFilter) {
            criteria = toEscapedCriteriaString(this.activeFilter, "NAME");
          }
          let count;
          const cacheTokenInfo = await ProfileManagement.generateCacheToken(
            this.parentPlex.getProfile(),
            this.getSession(),
            this.parentPlex.getPlexName(),
            this.constant,
            criteria,
            this.getParent().getGroupName(),
          );
          if (cacheTokenInfo) {
            const recordsCount = cacheTokenInfo.recordCount;
            if (recordsCount) {
              let allPipelines;
              if (recordsCount <= this.incrementCount) {
                allPipelines = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  this.getSession(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  recordsCount,
                );
              } else {
                allPipelines = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  this.getSession(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  this.incrementCount,
                );
                count = recordsCount;
              }
              this.addPipelinesUtil([], allPipelines, count);
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
            } else {
              this.children = [];
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
              window.showInformationMessage(`No pipelines found`);
              this.label = `All Pipelines${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${recordsCount}]`;
            }
          }
        } catch (error) {
          window.showErrorMessage(
            `Something went wrong when fetching pipelines - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
              /(\\n\t|\\n|\\t)/gm,
              " ",
            )}`,
          );
        }
      },
    );
  }

  public addPipelinesUtil(newChildren: (CICSPipelineTreeItem | ViewMore)[], allPipelines: any, count: number | undefined) {
    for (const pipeline of allPipelines) {
      const regionsContainer = this.parentPlex.children.filter((child) => child instanceof CICSRegionsContainer)?.[0];
      if (regionsContainer == null) {
        continue;
      }
      const parentRegion = regionsContainer
        .getChildren()!
        .filter((child) => child instanceof CICSRegionTree && child.getRegionName() === pipeline.eyu_cicsname)?.[0] as CICSRegionTree;
      const pipelineTree = new CICSPipelineTreeItem(pipeline, parentRegion, this);
      pipelineTree.setLabel(pipelineTree.label.toString().replace(pipeline.name, `${pipeline.name} (${pipeline.eyu_cicsname})`));
      newChildren.push(pipelineTree);
    }
    if (!count) {
      count = newChildren.length;
    }
    this.currentCount = newChildren.length;
    this.label = `All Pipelines ${this.activeFilter ? `(${this.activeFilter}) ` : " "}[${this.currentCount} of ${count}]`;
    if (count !== this.currentCount) {
      newChildren.push(new ViewMore(this, Math.min(this.incrementCount, count - this.currentCount)));
    }
    this.children = newChildren;
  }

  public async addMoreCachedResources(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading more pipelins",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async () => {
        let criteria;
        if (this.activeFilter) {
          criteria = toEscapedCriteriaString(this.activeFilter, "NAME");
        }
        const cacheTokenInfo = await ProfileManagement.generateCacheToken(
          this.parentPlex.getProfile(),
          this.getSession(),
          this.parentPlex.getPlexName(),
          this.constant,
          criteria,
          this.getParent().getGroupName(),
        );
        if (cacheTokenInfo) {
          // record count may have updated
          const recordsCount = cacheTokenInfo.recordCount;
          const count = recordsCount;
          const allPipelines = await ProfileManagement.getCachedResources(
            this.parentPlex.getProfile(),
            this.getSession(),
            cacheTokenInfo.cacheToken,
            this.constant,
            this.currentCount + 1,
            this.incrementCount,
          );
          if (allPipelines) {
            // @ts-ignore
            this.addPipelinesUtil(
              (this.getChildren()?.filter((child) => child instanceof CICSPipelineTreeItem) ?? []) as CICSPipelineTreeItem[],
              allPipelines,
              count,
            );
            tree._onDidChangeTreeData.fire(undefined);
          }
        }
      },
    );
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.label = `All Pipelines`;
    this.contextValue = `cicscombinedpipelinetree.unfiltered`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.label = `All Pipelines (${this.activeFilter})`;
    this.contextValue = `cicscombinedpipelinetree.filtered`;
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

  public getSession() {
    return this.getParent().getSession();
  }
}
