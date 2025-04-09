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

import { commands, window } from "vscode";
import { IResource } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSTree } from "../trees/CICSTree";

/**
 * Clear filter for a Regions Container (previously this was available on a plex)
 * @param tree
 * @param treeview
 * @returns
 */
export function getClearPlexFilterCommand(tree: CICSTree) {
  return commands.registerCommand("cics-extension-for-zowe.clearPlexFilter", async (node: CICSRegionsContainer) => {
    const plex = node.getParent();
    const plexProfile = plex.getProfile();

    let resourceOptions = ["All Resources"];
    if (!plexProfile.profile.regionName || !plexProfile.profile.cicsPlex) {
      resourceOptions = ["Regions", ...resourceOptions];
    }

    const resourceToClear = await window.showQuickPick(resourceOptions);

    if (!resourceToClear) {
      return;
    }

    node.filterRegions("*", tree);

    if (resourceToClear === "Regions") {
      return;
    }

    for (const region of node.children) {
      if (region.getIsActive() && region.children) {
        region.children.forEach((resourceTree: CICSResourceContainerNode<IResource>) => {
          resourceTree.clearFilter();
        });
        tree._onDidChangeTreeData.fire(region);
      }
    }
  });
}
