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
import { CICSProgramTreeItem } from "./treeItems/CICSProgramTreeItem";
import { CICSRegionTree } from "./CICSRegionTree";
import { getDefaultProgramFilter, toEscapedCriteriaString } from "../utils/filterUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { toArray } from "../utils/commandUtils";
import { runGetResource } from "../utils/resourceUtils";

export class CICSProgramTree extends TreeItem {
  children: CICSProgramTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false),
  ) {
    super("Programs", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreeprogram.${this.activeFilter ? "filtered" : "unfiltered"}.programs`;
    this.parentRegion = parentRegion;
  }

  public addProgram(program: CICSProgramTreeItem) {
    this.children.push(program);
  }

  public async loadContents() {
    const defaultCriteria = await getDefaultProgramFilter();
    let criteria;
    if (this.activeFilter) {
      criteria = toEscapedCriteriaString(this.activeFilter, "PROGRAM");
    } else {
      criteria = defaultCriteria;
    }
    this.children = [];
    try {
      const programResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: "CICSProgram",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: {criteria: criteria},
      });
      const programsArray = toArray(programResponse.response.records.cicsprogram);
      this.label = `Programs${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${programsArray.length}]`;
      for (const program of programsArray) {
        const newProgramItem = new CICSProgramTreeItem(program, this.parentRegion, this);
        this.addProgram(newProgramItem);
      }
      this.iconPath = getFolderIcon(true);
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a program filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No programs found`);
        this.label = `Programs${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);
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
    this.contextValue = `cicstreeprogram.${this.activeFilter ? "filtered" : "unfiltered"}.programs`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `cicstreeprogram.${this.activeFilter ? "filtered" : "unfiltered"}.programs`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentRegion;
  }
}
