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

import type { ITask } from "@zowe/cics-for-zowe-explorer-api";
import { type TreeView, commands, l10n, window } from "vscode";
import { TaskMeta, TransactionMeta } from "../doc";
import type { CICSResourceContainerNode } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";
import { revealResourceInTree } from "./revealNodeInTree";

/**
 * Inquire the associated transaction from a task
 * Extract data directly from node, then call revealResourceInTree
 */
export function getInquireTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireTransaction", async (node: CICSResourceContainerNode<ITask>) => {
    const msg = l10n.t("CICS Transaction resources are not visible. Enable them from your VS Code settings.");
    if (!openSettingsForHiddenResourceType(msg, l10n.t("Transaction"))) {
      return;
    }

    // Extract data from selected nodes
    const nodes = findSelectedNodes(treeview, TaskMeta, node) as CICSResourceContainerNode<ITask>[];
    
    if (!nodes || nodes.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Task selected"));
      return;
    }

    // Extract profile, cicsplex, regionname, meta, resource from node
    const firstNode = nodes[0];
    const profileName = firstNode.getProfile().name;
    const cicsplexName = firstNode.cicsplexName;
    const regionName = firstNode.regionName;

    // Pull transaction(s) from task(s) to reveal and collate as criteria
    const transactionNames = nodes
      .map((n) => n.getContainedResource().resource.attributes.tranid)
      .filter((name): name is string => !!name);
    
    if (transactionNames.length === 0) {
      window.showErrorMessage(l10n.t("No transaction associated with this task"));
      return;
    }

    try {
      await revealResourceInTree(
        tree,
        treeview,
        profileName,
        cicsplexName,
        regionName!,
        TransactionMeta,
        transactionNames
      );
    } catch (error) {
      window.showErrorMessage(error instanceof Error ? error.message : String(error));
    }
  });
}
