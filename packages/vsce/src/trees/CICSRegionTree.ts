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
import { CICSTaskTree } from "./CICSTaskTree";
import { IRegion } from "../doc/IRegion";
import resources, { IResource } from "../doc/IResourceTypes";
import { CICSLibraryTree } from "./CICSLibraryTree";
import { CICSResourceTree } from "./CICSResourceTree";
import { CICSWebTree } from "./CICSWebTree";

export class CICSRegionTree extends TreeItem {
  children: (CICSResourceTree<IResource> | CICSTaskTree | CICSLibraryTree | CICSWebTree)[] | null;
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
        new CICSResourceTree(resources.program, this),
        new CICSResourceTree(resources.transaction, this),
        new CICSResourceTree(resources.localFile, this),
        new CICSTaskTree(this),
        new CICSLibraryTree(this),
        new CICSWebTree(this),
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
