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
import { CICSRegionTree } from "../CICSRegionTree";
import { getIconByStatus } from "../../utils/iconUtils";

export class CICSTaskTreeItem extends TreeItem {
  task: any;
  parentRegion: CICSRegionTree;
  directParent: any;

  constructor(
    task: any,
    parentRegion: CICSRegionTree,
    directParent: any,
    public readonly iconPath = getIconByStatus("TASK", task)
  ) {
    super(`${task.task}`, TreeItemCollapsibleState.None);

    this.task = task;
    this.parentRegion = parentRegion;
    this.contextValue = `cicstask.`;
    this.directParent = directParent;
  }

  public setLabel(newLabel: string) {
    this.label = newLabel;
  }

  public getParent() {
    return this.directParent;
  }
}
