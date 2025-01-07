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
import { CICSRegionTree } from "../CICSRegionTree";
import { getResource } from "@zowe/cics-for-zowe-sdk";
import * as https from "https";
import { CICSLibraryDatasets } from "./CICSLibraryDatasets";
import { toEscapedCriteriaString } from "../../utils/filterUtils";
import { getIconOpen } from "../../utils/profileUtils";

export class CICSLibraryTreeItem extends TreeItem {
  children: CICSLibraryDatasets[] = [];
  library: any;
  parentRegion: CICSRegionTree;
  directParent: any;
  activeFilter: string | undefined = undefined;

  constructor(
    library: any,
    parentRegion: CICSRegionTree,
    directParent: any,
    public iconPath = getIconOpen(false)
  ) {
    super(`${library.name}`, TreeItemCollapsibleState.Collapsed);

    this.library = library;
    this.parentRegion = parentRegion;
    this.directParent = directParent;
    this.contextValue = `cicslibrary.${this.activeFilter ? "filtered" : "unfiltered"}${library.name}`;
  }

  public setLabel(newLabel: string) {
    this.label = newLabel;
  }

  public addDataset(dataset: CICSLibraryDatasets) {
    this.children.push(dataset);
  }

  public async loadContents() {
    const defaultCriteria = "(DSNAME=*)";
    let criteria;

    if (this.activeFilter) {
      criteria = toEscapedCriteriaString(this.activeFilter, "DSNAME");
    } else {
      criteria = defaultCriteria;
    }

    this.children = [];
    try {
      https.globalAgent.options.rejectUnauthorized = this.parentRegion.parentSession.session.ISession.rejectUnauthorized;

      const libraryResponse = await getResource(this.parentRegion.parentSession.session, {
        name: "cicslibrarydatasetname",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        criteria: criteria,
      });
      https.globalAgent.options.rejectUnauthorized = undefined;
      const datasetArray = Array.isArray(libraryResponse.response.records.cicslibrarydatasetname)
        ? libraryResponse.response.records.cicslibrarydatasetname
        : [libraryResponse.response.records.cicslibrarydatasetname];
      this.label = `${this.library.name}${this.parentRegion.parentPlex ? ` (${this.library.eyu_cicsname})` : ""}${
        this.activeFilter ? ` (${this.activeFilter}) ` : " "
      }[${datasetArray.length}]`;
      for (const dataset of datasetArray) {
        const newDatasetItem = new CICSLibraryDatasets(dataset, this.parentRegion, this); //this=CICSLibraryTreeItem
        this.addDataset(newDatasetItem);
      }
      this.iconPath = getIconOpen(true);
    } catch (error) {
      https.globalAgent.options.rejectUnauthorized = undefined;
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a datasets filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No datasets found`);
        this.label = `${this.library.name}${this.parentRegion.parentPlex ? ` (${this.library.eyu_cicsname})` : ""}${
          this.activeFilter ? ` (${this.activeFilter}) ` : " "
        }[0]`;
        this.iconPath = getIconOpen(true);
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching datasets - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " "
          )}`
        );
      }
    }
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.contextValue = `cicslibrary.${this.activeFilter ? "filtered" : "unfiltered"}${this.library.name}`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `cicslibrary.${this.activeFilter ? "filtered" : "unfiltered"}${this.library.name}`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.directParent;
  }
}
