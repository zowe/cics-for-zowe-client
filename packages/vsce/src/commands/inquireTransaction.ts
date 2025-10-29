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
import { TaskMeta, TransactionMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes, getResourceTree } from "../utils/commandUtils";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";
import { ITask, ITransaction, IResource } from "@zowe/cics-for-zowe-explorer-api";

/**
 * Inquire the associated transaction tree item from a task tree item
 */
export function getInquireTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireTransaction", async (node) => {
    const msg = "CICS Transaction resources are not visible. Enable them from your VS Code settings.";
    if (!openSettingsForHiddenResourceType(msg, "Transaction")) {
      return;
    }

    const nodes = findSelectedNodes(treeview, TaskMeta, node) as CICSResourceContainerNode<ITask>[];
    if (!nodes || !nodes.length) {
      window.showErrorMessage("No CICS Task selected");
      return;
    }

    let transactionTree: CICSResourceContainerNode<ITransaction> | undefined;
    const label = nodes[0].getParent().label;

    //if the label is All Tasks, we need to get the transaction tree from the regions node
    if (label === "All Tasks") {
      transactionTree = await getResourceTree<ITransaction>(treeview, nodes, CicsCmciConstants.CICS_LOCAL_TRANSACTION);
    } else {
      transactionTree = nodes[0]
        .getParent()
        .getParent()
        .children.filter(
          (child: CICSResourceContainerNode<IResource>) => child.resourceTypes.includes(TransactionMeta)
        )[0] as CICSResourceContainerNode<ITransaction>;
    }

    const pattern = nodes.map((n) => n.getContainedResource().resource.attributes.tranid);

    transactionTree.setCriteria(pattern);
    transactionTree.description = pattern.join(" OR ");
    tree._onDidChangeTreeData.fire(transactionTree);
    await treeview.reveal(transactionTree, { expand: true });
  });
}
