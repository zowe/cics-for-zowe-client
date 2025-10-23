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

import { IJVMServer } from "@zowe/cics-for-zowe-explorer-api";
import { TreeView, commands, window } from "vscode";
import { JVMEndpointMeta } from "../../doc";
import { CICSResourceContainerNode } from "../../trees";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { enableTreeItem } from "./enableResourceCommand";

/**
 * Performs enable on selected CICSJVMEndpoint nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getEnableJVMEndpointCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableJVMEndpoint", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, JVMEndpointMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS JVMEndpoint selected");
      return;
    }

    await enableTreeItem(nodes, tree, (node: CICSResourceContainerNode<IJVMServer>) => {
      return node.getContainedResource().resource.attributes;
    }, (response) => {
      return response.records?.cicsjvmendpoint?.enablestatus.toUpperCase() === "ENABLED";
    });
  });
}
