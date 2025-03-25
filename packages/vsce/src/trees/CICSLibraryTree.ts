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
import { TreeItem, TreeItemCollapsibleState, window } from "vscode";
import { toArray } from "../utils/commandUtils";
import { toEscapedCriteriaString } from "../utils/filterUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { runGetResource } from "../utils/resourceUtils";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSLibraryTreeItem } from "./treeItems/CICSLibraryTreeItem";
import { CICSLogger } from "../utils/CICSLogger";

export class CICSLibraryTree extends TreeItem {
  children: CICSLibraryTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false)
  ) {
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
      const libraryResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: CicsCmciConstants.CICS_LIBRARY_RESOURCE,
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        regionName: this.parentRegion.getRegionName(),
        params: { criteria: criteria },
      });

      const librariesArray = toArray(libraryResponse.response.records.cicslibrary);
      this.label = `Libraries${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${librariesArray.length}]`;
      CICSLogger.debug(`Adding [${librariesArray.length}] libraries`);
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
    CICSLogger.debug("Clear library filter");

    this.activeFilter = undefined;
    this.contextValue = `cicstreelibrary.${this.activeFilter ? "filtered" : "unfiltered"}.libraries`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    CICSLogger.debug(`Set library filter [${newFilter}]`);
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
