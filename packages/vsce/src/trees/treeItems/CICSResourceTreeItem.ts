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

import { IResource } from "@zowe/cics-for-zowe-sdk";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import IResourceMeta from "../../doc/IResourceMeta";
import { CICSRegionTree } from "../CICSRegionTree";
import { getIconFilePathFromName } from "../../utils/iconUtils";
import { CICSCombinedResourceTree } from "../CICSCombinedTrees/CICSCombinedResourceTree";
import { CICSLibraryDatasets } from "./CICSLibraryDatasets";
import { CICSResourceTree } from "../CICSResourceTree";

export class CICSResourceTreeItem<T extends IResource> extends TreeItem {
  resource: T;
  resourceMeta: IResourceMeta<T>;
  parentRegion: CICSRegionTree;
  directParent: CICSCombinedResourceTree<T> | CICSLibraryDatasets | CICSResourceTree<T>;

  constructor(
    resource: T,
    resourceMeta: IResourceMeta<T>,
    parentRegion: CICSRegionTree,
    directParent: CICSCombinedResourceTree<T> | CICSLibraryDatasets | CICSResourceTree<T>
  ) {
    super(
      resourceMeta.getLabel(resource),
      TreeItemCollapsibleState.None
    );

    this.resource = resource;
    this.parentRegion = parentRegion;
    this.directParent = directParent;
    this.contextValue = resourceMeta.getContext(resource);
    this.iconPath = getIconFilePathFromName(resourceMeta.getIconName(resource));
  }

  public setLabel(newLabel: string) {
    this.label = newLabel;
  }

  public getParent() {
    return this.directParent;
  }
}
