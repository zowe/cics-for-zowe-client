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

import { ITask, ITransaction } from "@zowe/cics-for-zowe-sdk";
import { commands, TreeView, window } from "vscode";
import { CICSCombinedResourceTree } from "../trees/CICSCombinedTrees/CICSCombinedResourceTree";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSResourceTree } from "../trees/CICSResourceTree";
import { CICSTree } from "../trees/CICSTree";
import { CICSResourceTreeItem } from "../trees/treeItems/CICSResourceTreeItem";
import { findSelectedNodes } from "../utils/commandUtils";

/**
 * Inquire the associated transaction tree item from a task tree item
 */
export function getInquireTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireTransaction", async (node) => {
    const allSelectedNodes: CICSResourceTreeItem<ITask>[] = findSelectedNodes(treeview, CICSResourceTreeItem, node) as CICSResourceTreeItem<ITask>[];
    if (!allSelectedNodes || !allSelectedNodes.length) {
      window.showErrorMessage("No CICS Task selected");
      return;
    }
    let resourceFolders;
    if (allSelectedNodes[0].getParent() instanceof CICSCombinedResourceTree) {
      const cicsPlex: CICSPlexTree = allSelectedNodes[0].getParent().getParent();
      const regionsContainer = cicsPlex.getChildren().filter((child) => child instanceof CICSRegionsContainer)[0];
      //@ts-ignore
      const regionTree: CICSRegionTree = regionsContainer
        .getChildren()!
        .filter((region: CICSRegionTree) => region.getRegionName() === allSelectedNodes[0].parentRegion.getRegionName())[0];
      resourceFolders = regionTree.getChildren()!;
    } else {
      resourceFolders = allSelectedNodes[0].parentRegion.getChildren()!;
    }
    const tranids = [];
    for (const localTaskTreeItem of allSelectedNodes) {
      const task = localTaskTreeItem.resource;
      tranids.push(task["tranid"]);
    }
    // Comma separated filter
    const pattern = tranids.join(", ");
    const localTransactionTree = resourceFolders.filter(
      (child) => child instanceof CICSResourceTree && child.resourceMeta.filterAttribute === "tranid")[0] as CICSResourceTree<ITransaction>;
    localTransactionTree.setFilter(pattern);
    await localTransactionTree.loadContents();
    tree._onDidChangeTreeData.fire(undefined);

    if (allSelectedNodes[0].getParent() instanceof CICSCombinedResourceTree) {
      const nodeToExpand: any = localTransactionTree;

      // TODO: Ideal situation would be to do await treeview.reveal(nodeToExpand), however this is resulting in an error,
      // so inquire/highlight parent node instead
      await treeview.reveal(nodeToExpand.getParent());
      tree._onDidChangeTreeData.fire(undefined);
    }
    tree._onDidChangeTreeData.fire(undefined);
  });
}
