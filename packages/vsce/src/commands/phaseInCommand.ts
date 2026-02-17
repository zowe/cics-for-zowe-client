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

import { type TreeView, commands, l10n, window } from "vscode";
import { ProgramMeta } from "../doc";
import type { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

/**
 * Performs PHASE IN on selected CICSProgram nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getPhaseInCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.phaseInCommand", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, ProgramMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({ action: "PHASEIN", nodes, tree });
  });
}
