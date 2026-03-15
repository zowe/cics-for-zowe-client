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

import { type TreeView, commands, l10n, window } from "vscode";
import { ProgramMeta, TransactionMeta } from "../doc";
import type { CICSTree } from "../trees/CICSTree";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";
import { getCommandInvocationContext, revealResourceInTree } from "./revealNodeInTree";

/**
 * Inquire the associated program from a transaction
 * Handles three scenarios:
 * 1. Transaction from a region tree node
 * 2. Transaction from "All Local Transactions" (CICSplex level)
 * 3. Transaction from Resource Inspector
 */
export function getInquireProgramCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireProgram", async (node) => {
    const msg = l10n.t("CICS Program resources are not visible. Enable them from your VS Code settings.");
    if (!openSettingsForHiddenResourceType(msg, l10n.t("Program"))) {
      return;
    }

    // Determine invocation context: Region tree, "All X" tree, or Resource Inspector
    const context = getCommandInvocationContext(treeview, TransactionMeta, node, tree);
    
    if (!context.resources || context.resources.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Transaction selected"));
      return;
    }

    // Get program names from all selected transactions (works for all invocation sources)
    const programNames = context.resources
      .map((item) => item.resource.program)
      .filter((name): name is string => !!name);
    
    if (programNames.length === 0) {
      window.showErrorMessage(l10n.t("No program associated with this transaction"));
      return;
    }

    // Use context from the first resource
    const resourceContext = context.resources[0].context;

    try {
      await revealResourceInTree({
        tree,
        treeview,
        context: resourceContext,
        resourceMeta: ProgramMeta,
        resourceNames: programNames,
        clearFilter: false,
      });
    } catch (error) {
      window.showErrorMessage(error instanceof Error ? error.message : String(error));
    }
  });
}
