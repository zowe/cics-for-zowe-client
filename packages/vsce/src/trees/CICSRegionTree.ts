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
import { workspace } from "vscode";

export class CICSRegionTree extends TreeItem {
  children: TreeItem[] | null;
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

      const config = workspace.getConfiguration("zowe.cics.resources");

      this.children = [
        config.get<boolean>("Program", true) ? new CICSProgramTree(this) : null,
        config.get<boolean>("Transaction", true) ? new CICSTransactionTree(this) : null,
        config.get<boolean>("LocalFile", true) ? new CICSLocalFileTree(this) : null,
        config.get<boolean>("Task", true) ? new CICSTaskTree(this) : null,
        config.get<boolean>("Library", true) ? new CICSLibraryTree(this) : null,
        config.get<boolean>("Pipeline", true) ? new CICSPipelineTree(this) : null,
        config.get<boolean>("TCP/IPService", true) ? new CICSTCPIPServiceTree(this) : null,
        config.get<boolean>("URIMap", true) ? new CICSURIMapTree(this) : null,
        config.get<boolean>("WebService", true) ? new CICSWebServiceTree(this) : null,
      ].filter((child) => child !== null);
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
