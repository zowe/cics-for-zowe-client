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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { commands, l10n, window } from "vscode";
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

    let resourceOptions = [l10n.t("All Resources")];
    if (!plexProfile.profile.regionName || !plexProfile.profile.cicsPlex) {
      resourceOptions = [l10n.t("Regions"), ...resourceOptions];
    }

    const resourceToClear = await window.showQuickPick(resourceOptions);

    if (!resourceToClear) {
      return;
    }

    node.filterRegions("*", tree);

    if (resourceToClear === l10n.t("Regions")) {
      return;
    }

    for (const region of node.children) {
      if (region.getIsActive() && region.children) {
        for (const child of region.children) {
          (child as CICSResourceContainerNode<IResource>).clearCriteria();
        }
        tree._onDidChangeTreeData.fire(region);
      }
    }
  });
}
