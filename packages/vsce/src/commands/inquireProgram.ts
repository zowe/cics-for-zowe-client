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

import type { ITransaction } from "@zowe/cics-for-zowe-explorer-api";
import { type TreeView, commands, l10n, window } from "vscode";
import { ProgramMeta, TransactionMeta } from "../doc";
import type { CICSResourceContainerNode } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";
import { revealResourceInTree } from "./revealNodeInTree";

/**
 * Inquire the associated program from a transaction
 * Extract data directly from node
 */
export function getInquireProgramCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireProgram", async (node) => {
    const msg = l10n.t("CICS Program resources are not visible. Enable them from your VS Code settings.");
    if (!openSettingsForHiddenResourceType(msg, l10n.t("Program"))) {
      return;
    }

    // Extract data from selected nodes
    const nodes = findSelectedNodes(treeview, TransactionMeta, node) as CICSResourceContainerNode<ITransaction>[];
    
    if (!nodes || nodes.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Transaction selected"));
      return;
    }

    // Extract profile, cicsplex, regionname, meta, resource from node
    const firstNode = nodes[0];
    const profileName = firstNode.getProfile().name;
    const cicsplexName = firstNode.cicsplexName;
    const regionName = firstNode.regionName;

    // Pull program(s) from transaction(s) to reveal and collate as criteria
    const programNames = nodes
      .map((n) => n.getContainedResource().resource.attributes.program);
    
    if (programNames.length === 0) {
      window.showErrorMessage(l10n.t("No program associated with this transaction"));
      return;
    }

    try {
      await revealResourceInTree(
        tree,
        treeview,
        profileName,
        cicsplexName,
        regionName!,
        ProgramMeta,
        programNames
      );
    } catch (error) {
      window.showErrorMessage(error instanceof Error ? error.message : String(error));
    }
  });
}
