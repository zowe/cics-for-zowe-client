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
import { TreeItem, TreeItemCollapsibleState, window, workspace } from "vscode";
import { toArray } from "../utils/commandUtils";
import { toEscapedCriteriaString } from "../utils/filterUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { runGetResource } from "../utils/resourceUtils";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSLocalFileTreeItem } from "./treeItems/CICSLocalFileTreeItem";
import { CICSLogger } from "../utils/CICSLogger";

export class CICSLocalFileTree extends TreeItem {
  children: CICSLocalFileTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false)
  ) {
    super("Local Files", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreelocalfile.${this.activeFilter ? "filtered" : "unfiltered"}.localFiles`;
    this.parentRegion = parentRegion;
  }

  public addLocalFile(localFile: CICSLocalFileTreeItem) {
    this.children.push(localFile);
  }

  public async loadContents() {
    let defaultCriteria = `${await workspace.getConfiguration().get("zowe.cics.localFile.filter")}`;
    if (!defaultCriteria || defaultCriteria.length === 0) {
      await workspace.getConfiguration().update("zowe.cics.localFile.filter", "file=*");
      defaultCriteria = "file=*";
    }
    let criteria;
    if (this.activeFilter) {
      criteria = toEscapedCriteriaString(this.activeFilter, "file");
    } else {
      criteria = defaultCriteria;
    }
    this.children = [];
    try {
      const localFileResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: { criteria: criteria },
      });
      const localFileArray = toArray(localFileResponse.response.records.cicslocalfile);
      this.label = `Local Files${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${localFileArray.length}]`;
      CICSLogger.debug(`Adding [${localFileArray.length}] local files`);
      for (const localFile of localFileArray) {
        const newLocalFileItem = new CICSLocalFileTreeItem(localFile, this.parentRegion, this);
        this.addLocalFile(newLocalFileItem);
      }
      this.iconPath = getFolderIcon(true);
    } catch (error) {
      // @ts-ignore
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a local file filter to narrow search`);
        // @ts-ignore
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No local files found`);
        this.label = `Local Files${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching local files - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " "
          )}`
        );
      }
    }
  }

  public clearFilter() {
    CICSLogger.debug("Cleared local file filter");
    this.activeFilter = undefined;
    this.contextValue = `cicstreelocalfile.${this.activeFilter ? "filtered" : "unfiltered"}.localFiles`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    CICSLogger.debug(`Set local file filter [${newFilter}]`);
    this.activeFilter = newFilter;
    this.contextValue = `cicstreelocalfile.${this.activeFilter ? "filtered" : "unfiltered"}.localFiles`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentRegion;
  }
}
