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
import { JVMServerMeta } from "../../doc";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { disableTreeItem } from "./disableResourceCommand";

/**
 * Performs disable on selected CICSJVMServer nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getDisableJVMServerCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.disableJVMServer", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS JVM Server selected");
      return;
    }

    let disableType = await window.showInformationMessage(
      `Choose how to purge tasks while disabling the JVM server`,
      ...["Phase Out", "Purge", "Force Purge", "Kill"]
    );
    if (!disableType) {
      return;
    }

    disableType = disableType.replace(" ", "").toUpperCase();

    await disableTreeItem(nodes, tree, undefined, (response) => {
      return response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "DISABLED";
    }, {
      name: "PURGETYPE",
      value: disableType
    });
  });
}
