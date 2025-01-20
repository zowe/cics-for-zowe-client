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

import { TreeItemCollapsibleState, TreeItem, window } from "vscode";
import { CICSRegionTree } from "./CICSRegionTree";
import { getResource } from "@zowe/cics-for-zowe-sdk";
import { getFolderIcon } from "../utils/iconUtils";
import { CICSLibraryTreeItem } from "./treeItems/CICSLibraryTreeItem";
import { toEscapedCriteriaString } from "../utils/filterUtils";
import { toArray } from "../utils/commandUtils";

export class CICSLibraryTree extends TreeItem {
  children: CICSLibraryTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(parentRegion: CICSRegionTree, public iconPath = getFolderIcon(false)) {
    super("Libraries", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreelibrary.${this.activeFilter ? "filtered" : "unfiltered"}.libraries`;
    this.parentRegion = parentRegion;
  }

  public addLibrary(library: CICSLibraryTreeItem) {
    this.children.push(library);
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

      const libraryResponse = await getResource(this.parentRegion.parentSession.session, {
        name: "CICSLibrary",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        criteria: criteria,
      });
      const librariesArray = toArray(libraryResponse.response.records.cicslibrary);
      this.label = `Libraries${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${librariesArray.length}]`;
      for (const library of librariesArray) {
        const newLibraryItem = new CICSLibraryTreeItem(library, this.parentRegion, this);
        this.addLibrary(newLibraryItem);
      }
      this.iconPath = getFolderIcon(true);
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a library filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No libraries found`);
        this.label = `Libraries${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching libraries - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " "
          )}`
        );
      }
    }
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.contextValue = `cicstreelibrary.${this.activeFilter ? "filtered" : "unfiltered"}.libraries`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `cicstreelibrary.${this.activeFilter ? "filtered" : "unfiltered"}.libraries`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentRegion;
  }
}
