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

import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { getIconByStatus } from "../utils/iconUtils";
import { CICSLibraryTree } from "./CICSLibraryTree";
import { CICSLocalFileTree } from "./CICSLocalFileTree";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSProgramTree } from "./CICSProgramTree";
import { CICSSessionTree } from "./CICSSessionTree";
import { CICSTaskTree } from "./CICSTaskTree";
import { CICSTransactionTree } from "./CICSTransactionTree";
import { CICSPipelineTree } from "./CICSPipelineTree";
import { CICSTCPIPServiceTree } from "./CICSTCPIPServiceTree";
import { CICSURIMapTree } from "./CICSURIMapTree";
import { CICSWebServiceTree } from "./CICSWebServiceTree";

export class CICSRegionTree extends TreeItem {
  children: [
        CICSProgramTree,
        CICSTransactionTree,
        CICSLocalFileTree,
        CICSTaskTree,
        CICSLibraryTree,
        CICSPipelineTree,
        CICSTCPIPServiceTree,
        CICSURIMapTree,
        CICSWebServiceTree,
      ]
    | null;
  region: any;
  parentSession: CICSSessionTree;
  parentPlex: CICSPlexTree | undefined;
  directParent: any;
  isActive: true | false;

  constructor(regionName: string, region: any, parentSession: CICSSessionTree, parentPlex: CICSPlexTree | undefined, directParent: any) {
    super(regionName, TreeItemCollapsibleState.Collapsed);
    this.region = region;
    this.contextValue = `cicsregion.${regionName}`;
    this.parentSession = parentSession;
    this.directParent = directParent;
    if (parentPlex) {
      this.parentPlex = parentPlex;
    }

    if (region.cicsstate) {
      this.isActive = region.cicsstate === "ACTIVE" ? true : false;
    } else {
      this.isActive = region.cicsstatus === "ACTIVE" ? true : false;
    }
    this.iconPath = getIconByStatus("REGION", this);
    if (!this.isActive) {
      this.children = null;
      this.collapsibleState = TreeItemCollapsibleState.None;
      this.iconPath = getIconByStatus("REGION", this);
      this.contextValue += ".inactive";
    } else {
      this.contextValue += ".active";
      this.children = [
        new CICSProgramTree(this),
        new CICSTransactionTree(this),
        new CICSLocalFileTree(this),
        new CICSTaskTree(this),
        new CICSLibraryTree(this),
        new CICSPipelineTree(this),
        new CICSTCPIPServiceTree(this),
        new CICSURIMapTree(this),
        new CICSWebServiceTree(this),
      ];
    }
  }

  public getRegionName() {
    return this.region.applid || this.region.cicsname;
  }

  public getIsActive() {
    return this.isActive;
  }

  public getChildren() {
    return this.children;
  }

  public getParent() {
    return this.directParent;
  }
}
