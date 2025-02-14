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

import { TreeItemCollapsibleState, TreeItem, window, workspace } from "vscode";
import { CICSRegionTree } from "./CICSRegionTree";
import { toEscapedCriteriaString } from "../utils/filterUtils";
import { getFolderIcon } from "../utils/iconUtils";
import { CICSTaskTreeItem } from "./treeItems/CICSTaskTreeItem";
import { toArray } from "../utils/commandUtils";
import { runGetResource } from "../utils/resourceUtils";

export class CICSTaskTree extends TreeItem {
  children: CICSTaskTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeTransactionFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false),
  ) {
    super("Tasks", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreetask.${this.activeTransactionFilter ? "filtered" : "unfiltered"}.tasks`;
    this.parentRegion = parentRegion;
  }

  public addTask(task: CICSTaskTreeItem) {
    this.children.push(task);
  }

  public async loadContents() {
    let defaultCriteria = `${await workspace.getConfiguration().get("zowe.cics.tasks.filter")}`;
    if (!defaultCriteria || defaultCriteria.length === 0) {
      await workspace.getConfiguration().update("zowe.cics.tasks.filter", "(TRANID=*)");
      defaultCriteria = "(TRANID=*)";
    }
    let criteria;
    if (this.activeTransactionFilter) {
      criteria = toEscapedCriteriaString(this.activeTransactionFilter, "TRANID");
    } else {
      criteria = defaultCriteria;
    }
    this.children = [];
    try {
      const taskResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: "CICSTASK",
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: {criteria: criteria},
      });

      const tasksArray = toArray(taskResponse.response.records.cicstask);
      this.label = `Tasks${this.activeTransactionFilter ? ` (${this.activeTransactionFilter}) ` : " "}[${tasksArray.length}]`;
      for (const task of tasksArray) {
        const newTaskItem = new CICSTaskTreeItem(task, this.parentRegion, this);
        // Show run status if run status isn't SUSPENDED (assuming SUSPENDED is default runstatus)
        newTaskItem.setLabel(
          newTaskItem.label
            .toString()
            .replace(task.task, `${task.task} - ${task.tranid}${task.runstatus !== "SUSPENDED" ? ` (${task.runstatus})` : ""}`),
        );
        this.addTask(newTaskItem);
      }
      this.iconPath = getFolderIcon(true);
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a task filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No tasks found`);
        this.label = `Tasks${this.activeTransactionFilter ? ` (${this.activeTransactionFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching tasks - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " ")}`,
        );
      }
    }
  }

  public clearFilter() {
    this.activeTransactionFilter = undefined;
    this.contextValue = `cicstreetask.${this.activeTransactionFilter ? "filtered" : "unfiltered"}.tasks`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeTransactionFilter = newFilter;
    this.contextValue = `cicstreetask.${this.activeTransactionFilter ? "filtered" : "unfiltered"}.tasks`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeTransactionFilter;
  }
}
