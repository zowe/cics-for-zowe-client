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

import { commands } from "vscode";
import { CICSTree } from "../trees/CICSTree";
import { getPatternFromFilter } from "../utils/filterUtils";
import { CICSResourceContainerNode } from "../trees";
import { ICICSTreeNode } from "../doc";

export function getFilterResourcesCommand(tree: CICSTree) {

  return commands.registerCommand("cics-extension-for-zowe.filterResources", async (node: CICSResourceContainerNode<ICICSTreeNode>) => {
    const pattern = await getPatternFromFilter(node.getChildResource().meta.humanReadableName, []);
    if (!pattern) {
      return;
    }

    node.getChildResource().resources.setCriteria(pattern);
    tree._onDidChangeTreeData.fire(node);
  });
}

export function getClearFilterCommand(tree: CICSTree) {

  return commands.registerCommand("cics-extension-for-zowe.clearFilter", (node: CICSResourceContainerNode<ICICSTreeNode>) => {
    node.getChildResource().resources.resetCriteria();
    tree._onDidChangeTreeData.fire(node);
  });

}
