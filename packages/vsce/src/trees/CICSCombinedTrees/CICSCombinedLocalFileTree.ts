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
import { ProgressLocation, TreeItem, TreeItemCollapsibleState, window, workspace } from "vscode";
import { toEscapedCriteriaString } from "../../utils/filterUtils";
import { getFolderIcon } from "../../utils/iconUtils";
import { ProfileManagement } from "../../utils/profileManagement";
import { CICSPlexTree } from "../CICSPlexTree";
import { CICSRegionTree } from "../CICSRegionTree";
import { CICSRegionsContainer } from "../CICSRegionsContainer";
import { CICSTree } from "../CICSTree";
import { CICSLocalFileTreeItem } from "../treeItems/CICSLocalFileTreeItem";
import { TextTreeItem } from "../treeItems/utils/TextTreeItem";
import { ViewMore } from "../treeItems/utils/ViewMore";

export class CICSCombinedLocalFileTree extends TreeItem {
  children: (CICSLocalFileTreeItem | ViewMore)[] | [TextTreeItem] | null;
  parentPlex: CICSPlexTree;
  activeFilter: string | undefined;
  currentCount: number;
  incrementCount: number;
  constant: string;

  constructor(
    parentPlex: CICSPlexTree,
    public iconPath = getFolderIcon(false)
  ) {
    super("All Local Files", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicscombinedlocalfiletree.`;
    this.parentPlex = parentPlex;
    this.children = [new TextTreeItem("Use the search button to display local files", "applyfiltertext.")];
    this.activeFilter = undefined;
    this.currentCount = 0;
    this.incrementCount = +`${workspace.getConfiguration().get("zowe.cics.allLocalFiles.recordCountIncrement")}`;
    this.constant = CicsCmciConstants.CICS_CMCI_LOCAL_FILE;
  }

  public async loadContents(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading Local Files",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {});
        let criteria;
        if (this.activeFilter) {
          criteria = toEscapedCriteriaString(this.activeFilter, "file");
        }
        let count;
        try {
          const cacheTokenInfo = await ProfileManagement.generateCacheToken(
            this.parentPlex.getProfile(),
            this.getSession(),
            this.parentPlex.getPlexName(),
            this.constant,
            criteria,
            this.getParent().getGroupName()
          );
          if (cacheTokenInfo) {
            const recordsCount = cacheTokenInfo.recordCount;
            if (recordsCount) {
              let allLocalFiles;
              if (recordsCount <= this.incrementCount) {
                allLocalFiles = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  this.getSession(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  recordsCount
                );
              } else {
                allLocalFiles = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  this.getSession(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  this.incrementCount
                );
                count = recordsCount;
              }
              this.addLocalFilesUtil([], allLocalFiles, count);
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
            } else {
              this.children = [];
              this.iconPath = getFolderIcon(true);
              tree._onDidChangeTreeData.fire(undefined);
              window.showInformationMessage(`No local files found`);
              this.label = `All Local Files${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${recordsCount}]`;
            }
          }
        } catch (error) {
          window.showErrorMessage(
            `Something went wrong when fetching local files - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
              /(\\n\t|\\n|\\t)/gm,
              " "
            )}`
          );
        }
      }
    );
  }

  public addLocalFilesUtil(newChildren: (CICSLocalFileTreeItem | ViewMore)[], allLocalFiles: any, count: number | undefined) {
    for (const localfile of allLocalFiles) {
      const regionsContainer = this.parentPlex.children.filter((child) => child instanceof CICSRegionsContainer)?.[0];
      if (regionsContainer == null) {
        continue;
      }
      const parentRegion = regionsContainer
        .getChildren()!
        .filter((child) => child instanceof CICSRegionTree && child.getRegionName() === localfile.eyu_cicsname)?.[0] as CICSRegionTree;
      const localFileTree = new CICSLocalFileTreeItem(localfile, parentRegion, this);
      localFileTree.setLabel(localFileTree.label.toString().replace(localfile.file, `${localfile.file} (${localfile.eyu_cicsname})`));
      newChildren.push(localFileTree);
    }
    if (!count) {
      count = newChildren.length;
    }
    this.currentCount = newChildren.length;
    this.label = `All Local Files ${this.activeFilter ? `(${this.activeFilter}) ` : " "}[${this.currentCount} of ${count}]`;
    if (count !== this.currentCount) {
      newChildren.push(new ViewMore(this, Math.min(this.incrementCount, count - this.currentCount)));
    }
    this.children = newChildren;
  }

  public async addMoreCachedResources(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading more local files",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async () => {
        const cacheTokenInfo = await ProfileManagement.generateCacheToken(
          this.parentPlex.getProfile(),
          this.getSession(),
          this.parentPlex.getPlexName(),
          this.constant,
          this.getParent().getGroupName()
        );
        if (cacheTokenInfo) {
          // record count may have updated
          const recordsCount = cacheTokenInfo.recordCount;
          const count = recordsCount;
          const allLocalFiles = await ProfileManagement.getCachedResources(
            this.parentPlex.getProfile(),
            this.getSession(),
            cacheTokenInfo.cacheToken,
            this.constant,
            this.currentCount + 1,
            this.incrementCount
          );
          if (allLocalFiles) {
            // @ts-ignore
            this.addLocalFilesUtil(
              (this.getChildren()?.filter((child) => child instanceof CICSLocalFileTreeItem) ?? []) as CICSLocalFileTreeItem[],
              allLocalFiles,
              count
            );
            tree._onDidChangeTreeData.fire(undefined);
          }
        }
      }
    );
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.label = `All Local Files`;
    this.contextValue = `cicscombinedlocalfiletree.unfiltered`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.label = `All Local Files (${this.activeFilter})`;
    this.contextValue = `cicscombinedlocalfiletree.filtered`;
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
