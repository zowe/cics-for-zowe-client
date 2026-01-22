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

import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { commands, type TreeView } from "vscode";
import type { ICICSTreeNode } from "../doc";
import type { CICSResourceContainerNode } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import { getPatternFromFilter } from "../utils/filterUtils";

export function getFilterResourcesCommand(tree: CICSTree, treeview: TreeView<ICICSTreeNode>) {
  return commands.registerCommand("cics-extension-for-zowe.filterResources", async (node: CICSResourceContainerNode<IResource>) => {
    const pattern = await getPatternFromFilter(
      node.resourceTypes[0].humanReadableNamePlural,
      node.resourceTypes[0].getCriteriaHistory(),
      node.resourceTypes[0].filterCaseSensitive
    );

    if (!pattern) {
      return;
    }
    //pattern is coming as "A,B,C,D..." so  need to split it into an array"
    const patternArray = pattern.split(",").map((s) => s.trim());
    for (const c of node.resourceTypes) {
      await c.appendCriteriaHistory(pattern);
    }
    await node.reset();
    node.setCriteria(patternArray);
    tree._onDidChangeTreeData.fire(node);
    await treeview.reveal(node, { expand: true });
  });
}

export function getClearFilterCommand(tree: CICSTree) {
  return commands.registerCommand("cics-extension-for-zowe.clearFilter", async (node: CICSResourceContainerNode<IResource>) => {
    node.clearCriteria();
    await node.reset();
    tree._onDidChangeTreeData.fire(node);
  });
}
