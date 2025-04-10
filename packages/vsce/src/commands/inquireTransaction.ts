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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { commands, TreeView, window } from "vscode";
import { IResource, ITask, ITransaction, TaskMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";

/**
 * Inquire the associated transaction tree item from a task tree item
 */
export function getInquireTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireTransaction", async (node) => {
    const nodes = findSelectedNodes(treeview, TaskMeta, node) as CICSResourceContainerNode<ITask>[];
    if (!nodes || !nodes.length) {
      window.showErrorMessage("No CICS Task selected");
      return;
    }

    const pattern = nodes.map((n) => n.getContainedResource().resource.attributes.tranid);
    const transactionTree = nodes[0]
      .getParent()
      .getParent()
      .children.filter(
        (child: CICSResourceContainerNode<IResource>) => child.getChildResource().meta.resourceName === CicsCmciConstants.CICS_LOCAL_TRANSACTION
      )[0] as CICSResourceContainerNode<ITransaction>;

    transactionTree.setFilter(pattern);
    transactionTree.description = pattern.join(" OR ");
    tree._onDidChangeTreeData.fire(transactionTree);
    await treeview.reveal(transactionTree, { expand: true });
  });
}
