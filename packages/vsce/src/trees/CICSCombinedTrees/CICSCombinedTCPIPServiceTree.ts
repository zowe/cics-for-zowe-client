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
import { getIconOpen } from "../../utils/iconUtils";
import { ViewMore } from "../treeItems/utils/ViewMore";
import { CICSTCPIPServiceTreeItem } from "../treeItems/web/treeItems/CICSTCPIPServiceTreeItem";

export class CICSCombinedTCPIPServiceTree extends TreeItem {
  children: (CICSTCPIPServiceTreeItem | ViewMore)[] | [TextTreeItem] | null;
  parentPlex: CICSPlexTree;
  activeFilter: string | undefined;
  currentCount: number;
  incrementCount: number;
  constant: string;

  constructor(parentPlex: CICSPlexTree, public iconPath = getIconOpen(false)) {
    super("All TCPIP Services", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicscombinedtcpipstree.`;
    this.parentPlex = parentPlex;
    this.children = [new TextTreeItem("Use the search button to display TCPIP Services", "applyfiltertext.")];
    this.activeFilter = undefined;
    this.currentCount = 0;
    this.incrementCount = +`${workspace.getConfiguration().get("zowe.cics.allTCPIPS.recordCountIncrement")}`;
    this.constant = "CICSTCPIPService";
  }

  public async loadContents(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading TCPIP Services",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (_, token) => {
        token.onCancellationRequested(() => { });
        try {
          let criteria;
          if (this.activeFilter) {
            criteria = toEscapedCriteriaString(this.activeFilter, "NAME");
          }
          let count;
          const cacheTokenInfo = await ProfileManagement.generateCacheToken(
            this.parentPlex.getProfile(),
            this.parentPlex.getPlexName(),
            this.constant,
            criteria,
            this.getParent().getGroupName()
          );
          if (cacheTokenInfo) {
            const recordsCount = cacheTokenInfo.recordCount;
            if (recordsCount) {
              let allTCPIPS;
              if (recordsCount <= this.incrementCount) {
                allTCPIPS = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  recordsCount
                );
              } else {
                allTCPIPS = await ProfileManagement.getCachedResources(
                  this.parentPlex.getProfile(),
                  cacheTokenInfo.cacheToken,
                  this.constant,
                  1,
                  this.incrementCount
                );
                count = recordsCount;
              }
              this.addTCPIPSUtil([], allTCPIPS, count);
              this.iconPath = getIconOpen(true);
              tree._onDidChangeTreeData.fire(undefined);
            } else {
              this.children = [];
              this.iconPath = getIconOpen(true);
              tree._onDidChangeTreeData.fire(undefined);
              window.showInformationMessage(`No TCPIP Services found`);
              this.label = `All TCPIP Services${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${recordsCount}]`;
            }
          }
        } catch (error) {
          window.showErrorMessage(
            `Something went wrong when fetching TCPIP Services TEST - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
              /(\\n\t|\\n|\\t)/gm,
              " "
            )}`
          );
        }
      }
    );
  }

  public addTCPIPSUtil(newChildren: (CICSTCPIPServiceTreeItem | ViewMore)[], allTCPIPS: any, count: number | undefined) {
    for (const tcpips of allTCPIPS) {
      // Regions container must exist if all TCPIP Services tree exists
      const regionsContainer = this.parentPlex.children.filter((child) => child instanceof CICSRegionsContainer)?.[0];
      if (regionsContainer == null) { continue; }
      const parentRegion = regionsContainer
        .getChildren()!
        .filter((child) => child instanceof CICSRegionTree && child.getRegionName() === tcpips.eyu_cicsname)?.[0] as CICSRegionTree;
      const tcpipsTree = new CICSTCPIPServiceTreeItem(tcpips, parentRegion, this);
      tcpipsTree.setLabel(
        tcpipsTree.label.toString().replace(tcpips.name, `${tcpips.name} (${tcpips.eyu_cicsname}) [Port #${tcpipsTree.tcpips.port}]`)
      );
      newChildren.push(tcpipsTree);
    }
    if (!count) {
      count = newChildren.length;
    }
    this.currentCount = newChildren.length;
    this.label = `All TCPIP Services ${this.activeFilter ? `(${this.activeFilter}) ` : " "}[${this.currentCount} of ${count}]`;
    if (count !== this.currentCount) {
      newChildren.push(new ViewMore(this, Math.min(this.incrementCount, count - this.currentCount)));
    }
    this.children = newChildren;
  }

  public async addMoreCachedResources(tree: CICSTree) {
    await window.withProgress(
      {
        title: "Loading more TCPIP Services",
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
          this.parentPlex.getPlexName(),
          this.constant,
          criteria,
          this.getParent().getGroupName()
        );
        if (cacheTokenInfo) {
          // record count may have updated
          const recordsCount = cacheTokenInfo.recordCount;
          const count = recordsCount;
          const allTCPIPS = await ProfileManagement.getCachedResources(
            this.parentPlex.getProfile(),
            cacheTokenInfo.cacheToken,
            this.constant,
            this.currentCount + 1,
            this.incrementCount
          );
          if (allTCPIPS) {
            // @ts-ignore
            this.addTCPIPSUtil(
              (this.getChildren()?.filter((child) => child instanceof CICSTCPIPServiceTreeItem) ?? []) as CICSTCPIPServiceTreeItem[],
              allTCPIPS,
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
    this.label = `All TCPIP Services`;
    this.contextValue = `cicscombinedtcpipstree.unfiltered`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.label = `All TCPIP Services (${this.activeFilter})`;
    this.contextValue = `cicscombinedtcpipstree.filtered`;
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
