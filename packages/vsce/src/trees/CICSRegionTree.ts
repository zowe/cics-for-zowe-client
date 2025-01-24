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
import { CICSSessionTree } from "./CICSSessionTree";
import { CICSPlexTree } from "./CICSPlexTree";
import { getIconByStatus } from "../utils/iconUtils";
import { IRegion, IResource } from "@zowe/cics-for-zowe-sdk";
import { CICSLibraryTree } from "./CICSLibraryTree";
import { CICSResourceTree } from "./CICSResourceTree";
import { LocalFileMeta, PipelineMeta, ProgramMeta, TaskMeta, TransactionMeta, URIMapMeta } from "../doc";
import { TCPIPMeta } from "../doc/TCPIPMeta";
import { WebServiceMeta } from "../doc/WebServiceMeta";

export class CICSRegionTree extends TreeItem {
  children: (CICSResourceTree<IResource> | CICSLibraryTree)[] | null;
  region: IRegion;
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
        new CICSResourceTree(ProgramMeta, this),
        new CICSResourceTree(TransactionMeta, this),
        new CICSResourceTree(LocalFileMeta, this),
        new CICSResourceTree(TaskMeta, this),
        new CICSLibraryTree(this),
        // new CICSWebTree(this),
        new CICSResourceTree(TCPIPMeta, this),
        new CICSResourceTree(URIMapMeta, this),
        new CICSResourceTree(PipelineMeta, this),
        new CICSResourceTree(WebServiceMeta, this),
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
