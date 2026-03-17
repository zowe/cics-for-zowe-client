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
import { commands, l10n, window, type TreeView } from "vscode";
import { CICSRegionsContainer } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import PersistentStorage from "../utils/PersistentStorage";
import { getPatternFromFilter } from "../utils/filterUtils";

/**
 * Apply filter for a Regions Container (previously this was available on a plex)
 * @param tree
 * @param treeview
 * @returns
 */
export function getFilterPlexResources(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.filterPlexResources", async (node) => {
    const selection = treeview.selection;
    let chosenNode: any;
    if (node) {
      chosenNode = node;
    } else if (selection[selection.length - 1] && selection[selection.length - 1] instanceof CICSRegionsContainer) {
      chosenNode = selection[selection.length - 1];
    } else {
      window.showErrorMessage(l10n.t("No 'Regions' node selected"));
      return;
    }
    const plex = chosenNode.getParent();
    await treeview.reveal(chosenNode, { expand: true });

    // Only filter regions
    const resourceHistory = PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_MANAGED_REGION);
    const pattern = await getPatternFromFilter("Region", resourceHistory);

    if (pattern) {
      await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_MANAGED_REGION, pattern);
      chosenNode.filterRegions(pattern, tree);
      tree._onDidChangeTreeData.fire(chosenNode);
    }
  });
}
