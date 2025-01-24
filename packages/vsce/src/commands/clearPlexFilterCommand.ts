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

import { imperative } from "@zowe/zowe-explorer-api";
import { commands, TreeView, window } from "vscode";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";

const doClear = async (region: CICSRegionTree, context: string) => {
  const treeToClear = region.children.filter((child: any) => child.contextValue.includes(`${context}.`))[0];
  treeToClear.clearFilter();
  await treeToClear.loadContents();
};

const clearResourcesMethodMap: { [key: string]: (region: CICSRegionTree) => Promise<void>; } = {
  "Programs": async (region: CICSRegionTree) => doClear(region, "cicstreeprogram"),
  "Local Transactions": async (region: CICSRegionTree) => doClear(region, "cicstreetransaction"),
  "Local Files": async (region: CICSRegionTree) => doClear(region, "cicstreelocalfile"),
  "Tasks": async (region: CICSRegionTree) => doClear(region, "cicstreetask"),
  "Libraries": async (region: CICSRegionTree) => doClear(region, "cicstreelibrary"),
  "TCPIP Services": async (region: CICSRegionTree) => doClear(region, "cicstreetcpips"),
  "URI Maps": async (region: CICSRegionTree) => doClear(region, "cicstreeurimaps"),
  "All": async (region: CICSRegionTree) => {
    for (const child of region.children) {
      child.clearFilter();
      await child.loadContents();
    }
  },
};

const getResourceToClear = async (profile: imperative.IProfile) => {
  let clearOptions = ["Programs", "Local Transactions", "Local Files", "Tasks", "Libraries", "All"];
  if (profile.regionName && profile.cicsPlex) {
    clearOptions = ["Regions", ...clearOptions];
  }

  const resourceToClear = await window.showQuickPick(clearOptions);
  if (!resourceToClear) {
    window.showInformationMessage("No option selected");
    return null;
  }
  return resourceToClear;
};

/**
 * Clear filter for a Regions Container (previously this was available on a plex)
 * @param tree
 * @param treeview
 * @returns
 */
export function getClearPlexFilterCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.clearPlexFilter", async (node) => {
    const allSelectedNodes: CICSRegionsContainer[] = findSelectedNodes(treeview, CICSRegionsContainer, node);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      window.showErrorMessage("No CICSPlex tree selected");
      return;
    }
    for (const selectedNode of allSelectedNodes) {
      const plex = selectedNode.getParent();
      const plexProfile = plex.getProfile();

      const resourceToClear = await getResourceToClear(plexProfile.profile);

      if ((resourceToClear === "Regions" || resourceToClear === "All") && !(plexProfile.profile.regionName && plexProfile.profile.cicsPlex)) {
        selectedNode.filterRegions("*", tree);
      }

      if (resourceToClear && resourceToClear !== "Regions") {
        for (const region of selectedNode.children) {
          if (region instanceof CICSRegionTree && region.getIsActive() && region.children && resourceToClear in clearResourcesMethodMap) {
            clearResourcesMethodMap[resourceToClear](region);
          }
        }
        tree._onDidChangeTreeData.fire(undefined);
      }
    }
  });
}
