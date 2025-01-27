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

import { TreeItemCollapsibleState, TreeItem } from "vscode";
import { getFolderIcon } from "../utils/iconUtils";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSURIMapTree } from "./treeItems/web/CICSURIMapTree";
import { CICSTCPIPServiceTree } from "./treeItems/web/CICSTCPIPServiceTree";
import { CICSPipelineTree } from "./treeItems/web/CICSPipelineTree";
import { CICSWebServiceTree } from "./treeItems/web/CICSWebServiceTree";

export class CICSWebTree extends TreeItem {
  children: [CICSTCPIPServiceTree, CICSURIMapTree, CICSPipelineTree, CICSWebServiceTree] | null;
  parentRegion: CICSRegionTree | undefined;
  //activeFilter: string | undefined = undefined;

  constructor(
    parentRegion: CICSRegionTree,
    public iconPath = getFolderIcon(false),
  ) {
    super("Web", TreeItemCollapsibleState.Collapsed);
    this.contextValue = `cicstreeweb.web`;
    this.parentRegion = parentRegion;

    this.children = [
      new CICSTCPIPServiceTree(parentRegion),
      new CICSURIMapTree(parentRegion),
      new CICSPipelineTree(parentRegion),
      new CICSWebServiceTree(parentRegion),
    ];
  }

  public loadContents() {
    this.iconPath = getFolderIcon(true);
  }

  public getChildren() {
    return this.children;
  }

  public getParent() {
    return this.parentRegion;
  }

  public clearFilter() {
    /*this.activeFilter = undefined;
    this.contextValue = `cicstreeweb.${this.activeFilter ? 'filtered' : 'unfiltered'}.web`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;*/
  }

  public setFilter(_newFilter: string) {
    /*this.activeFilter = newFilter;
    this.contextValue = `cicstreeweb.${this.activeFilter ? 'filtered' : 'unfiltered'}.web`;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;*/
  }

  public getFilter() {
    //return this.activeFilter;
  }
}
