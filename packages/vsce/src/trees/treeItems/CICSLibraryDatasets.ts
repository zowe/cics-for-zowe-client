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
import { getIconFilePathFromName } from "../../utils/iconUtils";
import { CICSProgramTreeItem } from "./CICSProgramTreeItem";
import { toEscapedCriteriaString } from "../../utils/filterUtils";
import { toArray } from "../../utils/commandUtils";
import { runGetResource } from "../../utils/resourceUtils";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";

export class CICSLibraryDatasets extends TreeItem {
  children: CICSProgramTreeItem[] = [];
  dataset: any;
  parentRegion: CICSRegionTree;
  directParent: any;
  activeFilter: string | undefined = undefined;

  constructor(
    dataset: any,
    parentRegion: CICSRegionTree,
    directParent: any,
    public iconPath = getIconFilePathFromName("library-dataset"),
  ) {
    super(`${dataset.dsname}`, TreeItemCollapsibleState.Collapsed);

    this.dataset = dataset;
    this.parentRegion = parentRegion;
    this.directParent = directParent;
    this.contextValue = `cicsdatasets.${this.activeFilter ? "filtered" : "unfiltered"}${dataset.dsname}`;
  }

  public setLabel(newlabel: string) {
    this.label = newlabel;
  }

  public addProgram(program: CICSProgramTreeItem) {
    this.children.push(program);
  }

  public async loadContents() {
    const defaultCriteria = `(librarydsn='${this.dataset.dsname}')`;
    let criteria;

    if (this.activeFilter) {
      criteria = defaultCriteria + " AND " + toEscapedCriteriaString(this.activeFilter, "PROGRAM");
    } else {
      criteria = defaultCriteria;
    }

    this.children = [];
    try {
      const datasetResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: {criteria: criteria},
      });

      const programsArray = toArray(datasetResponse.response.records.cicsprogram);
      this.label = `${this.dataset.dsname}${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${programsArray.length}]`;
      for (const program of programsArray) {
        const newProgramItem = new CICSProgramTreeItem(program, this.parentRegion, this);
        this.addProgram(newProgramItem);
      }
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a program filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No programs found`);
        this.label = `${this.dataset.dsname}${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching programs - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " ",
          )}`,
        );
      }
    }
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.contextValue = `cicsdatasets.${this.activeFilter ? "filtered" : "unfiltered"}${this.dataset.dsname}`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `cicsdatasets.${this.activeFilter ? "filtered" : "unfiltered"}${this.dataset.dsname}`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.directParent;
  }
}
