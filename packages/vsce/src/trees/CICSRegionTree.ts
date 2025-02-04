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
import { getIconFilePathFromName } from "../utils/iconUtils";
import { IRegion, IResource } from "@zowe/cics-for-zowe-sdk";
import { CICSLibraryTree } from "./CICSLibraryTree";
import { CICSResourceTree } from "./CICSResourceTree";
import { getMetas } from "../doc";
import { CICSRegionsContainer } from "./CICSRegionsContainer";
import { RegionMeta } from "../doc/RegionMeta";
import { PersistentStorage } from "../utils/PersistentStorage";

export class CICSRegionTree extends TreeItem {
  children: (CICSResourceTree<IResource> | CICSLibraryTree)[] | null;
  region: IRegion;
  parentSession: CICSSessionTree;
  parentPlex: CICSPlexTree | undefined;
  directParent: CICSPlexTree | CICSRegionsContainer | CICSSessionTree;
  isActive: true | false;

  constructor(
    region: IRegion,
    parentSession: CICSSessionTree,
    parentPlex: CICSPlexTree | undefined,
    directParent: CICSPlexTree | CICSRegionsContainer | CICSSessionTree
  ) {
    super(RegionMeta.getLabel(region), TreeItemCollapsibleState.Collapsed);
    this.region = region;
    this.contextValue = RegionMeta.getContext(region);
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
    this.iconPath = getIconFilePathFromName(RegionMeta.getIconName(region));
    if (this.isActive) {

      const pers = new PersistentStorage("zowe.cics.persistent");

      const visibles = pers.getVisibleResources();
      const availableMetas = getMetas();

      this.children = [
        ...availableMetas.filter((meta) => visibles.includes(meta.resourceName)).map((meta) => {
          if (meta.resourceName === "CICSLibrary") {
            return new CICSLibraryTree(this);
          }
          // @ts-ignore
          return new CICSResourceTree(meta, this);
        }),
      ];

    } else {
      this.children = null;
      this.collapsibleState = TreeItemCollapsibleState.None;
      this.iconPath = getIconFilePathFromName(RegionMeta.getIconName(region));
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
