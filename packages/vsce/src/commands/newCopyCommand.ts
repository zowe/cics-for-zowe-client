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

import { IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { commands, TreeView, window } from "vscode";
import { ProgramMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

/**
 * Performs new copy on selected CICSProgram nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getNewCopyCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.newCopyProgram", async (clickedNode: CICSResourceContainerNode<IProgram>) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS program selected");
      return;
    }

    await actionTreeItem({ action: "NEWCOPY", nodes, tree });
  });
}
