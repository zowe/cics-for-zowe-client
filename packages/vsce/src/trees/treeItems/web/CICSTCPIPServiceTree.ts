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
import { CICSTCPIPServiceTreeItem } from "./treeItems/CICSTCPIPServiceTreeItem";
import { CICSRegionTree } from "../../CICSRegionTree";
import { runGetResource } from "../../../utils/resourceUtils";
import { toEscapedCriteriaString } from "../../../utils/filterUtils";
import { getFolderIcon } from "../../../utils/iconUtils";
import { toArray } from "../../../utils/commandUtils";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";

export class CICSTCPIPServiceTree extends TreeItem {
  children: CICSTCPIPServiceTreeItem[] = [];
  parentRegion: CICSRegionTree;
  activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false),
  ) {
    super("TCPIP Services", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreetcpips.${this.activeFilter ? "filtered" : "unfiltered"}.tcpips`;
    this.parentRegion = parentRegion;
  }

  public addTCPIPS(tcpips: CICSTCPIPServiceTreeItem) {
    this.children.push(tcpips);
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
      const tcpipsResponse = await runGetResource({
        session: this.parentRegion.parentSession.session,
        resourceName: CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE,
        regionName: this.parentRegion.getRegionName(),
        cicsPlex: this.parentRegion.parentPlex ? this.parentRegion.parentPlex.getPlexName() : undefined,
        params: {criteria: criteria},
      });
      const tcpipservicesArray = toArray(tcpipsResponse.response.records.cicstcpipservice);
      this.label = `TCPIP Services${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[${tcpipservicesArray.length}]`;
      for (const tcpips of tcpipservicesArray) {
        const newTCPIPServiceItem = new CICSTCPIPServiceTreeItem(tcpips, this.parentRegion, this);
        newTCPIPServiceItem.setLabel(
          newTCPIPServiceItem.label.toString().replace(tcpips.name, `${tcpips.name} [Port #${newTCPIPServiceItem.tcpips.port}]`),
        );
        this.addTCPIPS(newTCPIPServiceItem);
      }
      this.iconPath = getFolderIcon(true);
    } catch (error) {
      if (error.mMessage!.includes("exceeded a resource limit")) {
        window.showErrorMessage(`Resource Limit Exceeded - Set a TCPIPService filter to narrow search`);
      } else if (this.children.length === 0) {
        window.showInformationMessage(`No TCPIP Services found`);
        this.label = `TCPIP Services${this.activeFilter ? ` (${this.activeFilter}) ` : " "}[0]`;
        this.iconPath = getFolderIcon(true);
      } else {
        window.showErrorMessage(
          `Something went wrong when fetching TCPIP services - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " ",
          )}`,
        );
      }
    }
  }

  public clearFilter() {
    this.activeFilter = undefined;
    this.contextValue = `cicstreetcpips.${this.activeFilter ? "filtered" : "unfiltered"}.tcpips`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public setFilter(newFilter: string) {
    this.activeFilter = newFilter;
    this.contextValue = `cicstreetcpips.${this.activeFilter ? "filtered" : "unfiltered"}.tcpips`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  public getFilter() {
    return this.activeFilter;
  }

  public getParent() {
    return this.parentRegion;
  }
}
