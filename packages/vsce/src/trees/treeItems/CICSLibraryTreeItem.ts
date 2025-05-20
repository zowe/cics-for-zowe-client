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
import { runGetResource } from "../../utils/resourceUtils";
import { CICSRegionTree } from "../CICSRegionTree";
import { CICSLibraryDatasets } from "./CICSLibraryDatasets";

import { toArray } from "../../utils/commandUtils";
import { getIconFilePathFromName } from "../../utils/iconUtils";

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
    public iconPath = getIconFilePathFromName("library")
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
    const defaultCriteria = `(LIBRARY=${this.library.name})`;
    let criteria;

    if (this.activeFilter) {
      criteria = `(LIBRARY=${this.library.name} AND DSNAME=${this.activeFilter})`;
    } else {
      criteria = defaultCriteria;
    }

    this.children = [];
    try {
      const libraryResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: "cicslibrarydatasetname",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: { criteria: criteria },
      });
      const datasetArray = toArray(libraryResponse.response.records.cicslibrarydatasetname);
      this.label = this.buildLabel(datasetArray);
      for (const dataset of datasetArray) {
        const newDatasetItem = new CICSLibraryDatasets(dataset, this.parentRegion, this); //this=CICSLibraryTreeItem
        this.addDataset(newDatasetItem);
      }
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a datasets filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No datasets found`);
        this.label = this.buildLabel([]);
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
//loadContents does not work with DSNAME filter,cmci returns invalid params with activeFilter
  public async loadContentsWithDSFilter() {
    const defaultCriteria = `(LIBRARY=${this.library.name})`;
    this.children = [];
    try {
      const libraryResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: "cicslibrarydatasetname",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: { criteria: defaultCriteria },
      });
      let datasetArray = toArray(libraryResponse.response.records.cicslibrarydatasetname);
      datasetArray = datasetArray.filter((dataset => dataset["dsname"] === this.activeFilter));
      this.label = this.buildLabel(datasetArray);
      for (const dataset of datasetArray) {
        const newDatasetItem = new CICSLibraryDatasets(dataset, this.parentRegion, this); 
        this.addDataset(newDatasetItem);
      }
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a datasets filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No datasets found`);
        this.label = this.buildLabel([]);
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

  private buildLabel(arr?: any[]) {
    let labelContent = this.library.name;
    labelContent += this.parentRegion.parentPlex ? ` (${this.library.eyu_cicsname})` : "";
    labelContent += this.activeFilter ? ` (${this.activeFilter}) ` : " ";
    if (arr) {
      labelContent += `[${arr.length}]`;
    }
    return labelContent;
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
