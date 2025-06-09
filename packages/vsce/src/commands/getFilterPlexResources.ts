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

import { commands, ProgressLocation, TreeView, window } from "vscode";
import { CICSRegionsContainer } from "../trees";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSTree } from "../trees/CICSTree";
import { getPatternFromFilter } from "../utils/filterUtils";
import PersistentStorage from "../utils/PersistentStorage";

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
      window.showErrorMessage("No 'Regions' node selected");
      return;
    }
    const plex = chosenNode.getParent();
    await treeview.reveal(chosenNode, { expand: true });
    const plexProfile = plex.getProfile();
    let resourceToFilter: any;
    if (plexProfile.profile.regionName && plexProfile.profile.cicsPlex) {
      resourceToFilter = await window.showQuickPick(["Programs", "Local Transactions", "Local Files", "Tasks", "Libraries"]);
    } else {
      resourceToFilter = await window.showQuickPick(["Regions", "Programs", "Local Transactions", "Local Files", "Tasks", "Libraries"]);
    }

    let resourceHistory;
    const settingNameMap: { [key: string]: string } = {
      Programs: "program",
      "Local Transactions": "transaction",
      "Local Files": "localFile",
      Tasks: "transaction",
      Libraries: "library",
      Regions: "region",
    };

    if (resourceToFilter in settingNameMap) {
      resourceHistory = await PersistentStorage.getResourceSearchHistory(settingNameMap[resourceToFilter]);
    } else {
      window.showInformationMessage("No Selection Made");
      return;
    }

    const pattern = await getPatternFromFilter(resourceToFilter.slice(0, -1), resourceHistory);

    if (!pattern) {
      return;
    }

    await PersistentStorage.appendResourceSearchHistory(settingNameMap[resourceToFilter], pattern);

    if (resourceToFilter === "Regions") {
      chosenNode.filterRegions(pattern, tree);
    } else {
      await window.withProgress(
        {
          title: "Loading Resources",
          location: ProgressLocation.Notification,
          cancellable: true,
        },
        (_, token): Thenable<unknown> => {
          token.onCancellationRequested(() => {});
          for (const region of chosenNode.children) {
            if (region instanceof CICSRegionTree) {
              if (region.getIsActive()) {
                const contextNameMap: { [key: string]: string } = {
                  "Local Transactions": "Transactions",
                };

                const treeToFilter = region.children?.filter((child: any) =>
                  child.contextValue.includes(
                    `CICSResourceNode.${resourceToFilter in contextNameMap ? contextNameMap[resourceToFilter] : resourceToFilter}`
                  )
                )[0];

                if (treeToFilter) {
                  // @ts-ignore
                  treeToFilter.setFilter([pattern]);
                  treeToFilter.description = pattern;
                }
              }
            }
          }
          return;
        }
      );
    }
    tree._onDidChangeTreeData.fire(chosenNode);
  });
}
