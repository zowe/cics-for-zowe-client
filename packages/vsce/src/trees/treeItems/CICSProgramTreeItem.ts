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

export class CICSProgramTreeItem extends TreeItem {
  program: any;
  parentRegion: CICSRegionTree;
  directParent: any;

  constructor(
    program: any,
    parentRegion: CICSRegionTree,
    directParent: any,
    public readonly iconPath = getIconByStatus("PROGRAM", program)
  ) {
    super(
      `${program.program}${
        program.status.toLowerCase() === "disabled" && parseInt(program.newcopycnt) ? ` (New copy count: ${program.newcopycnt}) (Disabled)`
        : program.status.toLowerCase() === "disabled" && !parseInt(program.newcopycnt) ? ` (Disabled)`
        : program.status.toLowerCase() !== "disabled" && parseInt(program.newcopycnt) ? ` (New copy count: ${program.newcopycnt})`
        : ""
      }`,
      TreeItemCollapsibleState.None
    );

    this.program = program;
    this.parentRegion = parentRegion;
    this.directParent = directParent;
    this.contextValue = `cicsprogram.${program.status.toLowerCase()}.${program.program}`;
  }

  public setLabel(newLabel: string) {
    this.label = newLabel;
  }

  public getParent() {
    return this.directParent;
  }
}
