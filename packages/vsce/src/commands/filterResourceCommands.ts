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

import { commands, TreeView } from "vscode";
import { ICICSTreeNode, IResource } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { getPatternFromFilter } from "../utils/filterUtils";

export function getFilterResourcesCommand(tree: CICSTree, treeview: TreeView<ICICSTreeNode>) {
  return commands.registerCommand("cics-extension-for-zowe.filterResources", async (node: CICSResourceContainerNode<IResource>) => {
    const pattern = await getPatternFromFilter(node.getChildResource().meta.humanReadableName, []);
    if (!pattern) {
      return;
    }

    node.setFilter([pattern]);
    node.description = pattern;
    tree._onDidChangeTreeData.fire(node);
    await treeview.reveal(node, { expand: true });
  });
}

export function getClearFilterCommand(tree: CICSTree) {
  return commands.registerCommand("cics-extension-for-zowe.clearFilter", (node: CICSResourceContainerNode<IResource>) => {
    node.clearFilter();
    node.description = "";
    tree._onDidChangeTreeData.fire(node);
  });
}
