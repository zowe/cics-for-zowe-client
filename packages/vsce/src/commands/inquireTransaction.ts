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
import { type TreeView, commands, l10n, window } from "vscode";
import { TaskMeta, TransactionMeta } from "../doc";
import type { CICSTree } from "../trees/CICSTree";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";
import { getCommandInvocationContext, InvocationSource, revealResourceInTree } from "./revealNodeInTree";

/**
 * Inquire the associated transaction from a task
 * Handles three scenarios:
 * 1. Task from a region tree node
 * 2. Task from "All Tasks" (CICSplex level)
 * 3. Task from Resource Inspector
 */
export function getInquireTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireTransaction", async (node) => {
    const msg = l10n.t("CICS Transaction resources are not visible. Enable them from your VS Code settings.");
    if (!openSettingsForHiddenResourceType(msg, l10n.t("Transaction"))) {
      return;
    }

    // Determine invocation context: Region tree, "All X" tree, or Resource Inspector
    const context = getCommandInvocationContext(treeview, TaskMeta, node, tree);
    
    if (!context.resources || context.resources.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Task selected"));
      return;
    }

    // Verify it's a Task resource (for inspector invocations)
    if (context.source === InvocationSource.ResourceInspector) {
      const firstResource = context.resources[0];
      if (firstResource.meta.resourceName !== CicsCmciConstants.CICS_CMCI_TASK) {
        window.showErrorMessage(l10n.t("This command can only be used with Task resources"));
        return;
      }
    }

    // Get transaction names from all selected tasks (works for all invocation sources)
    const transactionNames = context.resources
      .map((item) => item.resource.tranid)
      .filter((name): name is string => !!name);
    
    if (transactionNames.length === 0) {
      window.showErrorMessage(l10n.t("No transaction associated with this task"));
      return;
    }

    // Use context from the first resource
    const resourceContext = context.resources[0].context;

    try {
      await revealResourceInTree({
        tree,
        treeview,
        context: resourceContext,
        resourceMeta: TransactionMeta,
        resourceNames: transactionNames,
      });
    } catch (error) {
      window.showErrorMessage(error instanceof Error ? error.message : String(error));
    }
  });
}
