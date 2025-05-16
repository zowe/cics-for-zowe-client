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
import { CICSPipelineTreeItem } from "./treeItems/CICSPipelineTreeItem";
import { CICSLogger } from "../utils/CICSLogger";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";

export class CICSPipelineTree extends TreeItem {
  children: CICSPipelineTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false)
  ) {
    super("Pipelines", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreepipeline.${this.activeFilter ? "filtered" : "unfiltered"}.pipelines`;
    this.parentRegion = parentRegion;
  }

  public addPipeline(pipeline: CICSPipelineTreeItem) {
    this.children.push(pipeline);
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
      const pipelineResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: CicsCmciConstants.CICS_CMCI_PIPELINE,
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: { criteria: criteria },
      });
      const pipelinesArray = toArray(pipelineResponse.response.records.cicspipeline);
      this.label = `Pipelines${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${pipelinesArray.length}]`;
      CICSLogger.debug(`Adding [${pipelinesArray.length}] pipelines`);
      for (const pipeline of pipelinesArray) {
        const newPipelineItem = new CICSPipelineTreeItem(pipeline, this.parentRegion, this);
        newPipelineItem.setLabel(newPipelineItem.label.toString().replace(pipeline.name, `${pipeline.name}`));
        this.addPipeline(newPipelineItem);
      }
      this.iconPath = getFolderIcon(true);
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a Pipeline filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No Pipelines found`);
        this.label = `Pipelines${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching Pipelines - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " "
          )}`
        );
      }
    }
  }

  public clearFilter() {
    CICSLogger.debug("Cleared pipeline filter");
    this.activeFilter = undefined;
    this.contextValue = `cicstreepipeline.${this.activeFilter ? "filtered" : "unfiltered"}.pipelines`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    CICSLogger.debug(`Set pipeline filter [${newFilter}]`);
    this.activeFilter = newFilter;
    this.contextValue = `cicstreepipeline.${this.activeFilter ? "filtered" : "unfiltered"}.pipelines`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentRegion;
  }
}
