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

import { TreeItem, TreeItemCollapsibleState, window } from "vscode";
import { toArray } from "../utils/commandUtils";
import { toEscapedCriteriaString } from "../utils/filterUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { runGetResource } from "../utils/resourceUtils";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSURIMapTreeItem } from "./treeItems/CICSURIMapTreeItem";

export class CICSURIMapTree extends TreeItem {
  children: CICSURIMapTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false)
  ) {
    super("URI Maps", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreeurimaps.${this.activeFilter ? "filtered" : "unfiltered"}.urimaps`;
    this.parentRegion = parentRegion;
  }

  public addURIMAP(urimap: CICSURIMapTreeItem) {
    this.children.push(urimap);
  }

  public async loadContents() {
    const defaultCriteria = "(name=*)";
    let criteria;
    if (this.activeFilter) {
      criteria = toEscapedCriteriaString(this.activeFilter, "NAME");
    } else {
      criteria = defaultCriteria;
    }
    this.children = [];
    try {
      const urimapResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: "CICSURIMap",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: { criteria: criteria },
      });
      const urimapArray = toArray(urimapResponse.response.records.cicsurimap);
      this.label = `URI Maps${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${urimapArray.length}]`;
      for (const urimap of urimapArray) {
        const newURIMapItem = new CICSURIMapTreeItem(urimap, this.parentRegion, this);
        newURIMapItem.setLabel(
          newURIMapItem.label.toString().replace(urimap.name, `${urimap.name} [${newURIMapItem.urimap.scheme}] (${newURIMapItem.urimap.path})`)
        );
        this.addURIMAP(newURIMapItem);
      }
      this.iconPath = getFolderIcon(true);
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a URIMap filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No URI Maps found`);
        this.label = `URI Maps${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching URI Maps - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " "
          )}`
        );
      }
    }
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.contextValue = `cicstreeurimaps.${this.activeFilter ? "filtered" : "unfiltered"}.urimaps`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `cicstreeurimaps.${this.activeFilter ? "filtered" : "unfiltered"}.urimaps`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentRegion;
  }
}
