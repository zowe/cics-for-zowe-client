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

import { commands, TreeView, window } from "vscode";
import { BundleMeta } from "../../doc";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { disableTreeItem } from "./disableResourceCommand";

/**
 * Performs disable on selected CICSBundle nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getDisableBundleCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.disableBundle", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, BundleMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS Bundles selected");
      return;
    }

    await disableTreeItem(nodes, tree, undefined, (response) => {
      return response.records?.cicsbundle?.enablestatus.toUpperCase() === "DISABLED";
    });
  });
}
