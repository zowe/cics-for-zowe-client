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
import { getIconByStatus } from "../../utils/iconUtils";
import { CICSRegionTree } from "../CICSRegionTree";

export class CICSLocalFileTreeItem extends TreeItem {
  localFile: any;
  parentRegion: CICSRegionTree;
  directParent: any;
  localFileName: string;

  constructor(
    localFile: any,
    parentRegion: CICSRegionTree,
    directParent: any,
    public readonly iconPath = getIconByStatus("LOCAL_FILE", localFile)
  ) {
    super(
      `${localFile.file} ${
        localFile.enablestatus.toLowerCase() === "disabled" && localFile.openstatus.toLowerCase() === "closed" ? "(Disabled) (Closed)"
        : localFile.enablestatus.toLowerCase() === "disabled" && localFile.openstatus.toLowerCase() !== "closed" ? "(Disabled)"
        : localFile.enablestatus.toLowerCase() === "unenabled" && localFile.openstatus.toLowerCase() === "closed" ? "(Unenabled) (Closed)"
        : localFile.enablestatus.toLowerCase() === "unenabled" && localFile.openstatus.toLowerCase() !== "closed" ? "(Unenabled)"
        : localFile.enablestatus.toLowerCase() === "enabled" && localFile.openstatus.toLowerCase() === "closed" ? "(Closed)"
        : ""
      }`,
      TreeItemCollapsibleState.None
    );
    this.localFile = localFile;
    this.contextValue = `cicslocalfile.${localFile.enablestatus.toLowerCase()}.${localFile.openstatus.toLowerCase()}.${localFile.file}`;
    this.parentRegion = parentRegion;
    this.directParent = directParent;
    this.localFileName = localFile.file;
  }

  public setLabel(newLabel: string) {
    this.label = newLabel;
  }

  public getParent() {
    return this.directParent;
  }
}
