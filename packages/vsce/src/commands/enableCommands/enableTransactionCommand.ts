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

import { TreeView, commands, window } from "vscode";
import { TransactionMeta } from "../../doc";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { enableTreeItem } from "./enableResourceCommand";

export function getEnableTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableTransaction", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, TransactionMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS transaction selected");
      return;
    }

    await enableTreeItem(nodes, tree);
  });
}
