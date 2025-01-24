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

import { commands, ProgressLocation, TreeItemCollapsibleState, TreeView, window } from "vscode";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSTree } from "../trees/CICSTree";
import { getPatternFromFilter } from "../utils/filterUtils";
import { PersistentStorage } from "../utils/PersistentStorage";


const getSearchHistory = (persistentStorage: PersistentStorage, resourceToFilter: string): string[] | null => {

  const searchHistoryMap = {
    "Programs": () => { return persistentStorage.getProgramSearchHistory(); },
    "Local Transactions": () => { return persistentStorage.getTransactionSearchHistory(); },
    "Local Files": () => { return persistentStorage.getLocalFileSearchHistory(); },
    "Tasks": () => { return persistentStorage.getTransactionSearchHistory(); },
    "Libraries": () => { return persistentStorage.getLibrarySearchHistory(); },
    "Regions": () => { return persistentStorage.getRegionSearchHistory(); },
  };

  if (resourceToFilter in searchHistoryMap) {
    return searchHistoryMap[resourceToFilter as keyof typeof searchHistoryMap]();
  }

  window.showInformationMessage("No Selection Made");
  return null;

};

const addSearchHistory = async (persistentStorage: PersistentStorage, resourceToFilter: string, pattern: string) => {
  const searchHistoryMap = {
    "Programs": async () => { await persistentStorage.addProgramSearchHistory(pattern); },
    "Local Transactions": async () => { await persistentStorage.addTransactionSearchHistory(pattern); },
    "Local Files": async () => { await persistentStorage.addLocalFileSearchHistory(pattern); },
    "Regions": async () => { await persistentStorage.addRegionSearchHistory(pattern); },
    "Tasks": async () => { await persistentStorage.addTransactionSearchHistory(pattern); },
    "Libraries": async () => { await persistentStorage.addLibrarySearchHistory(pattern); },
  };
  await searchHistoryMap[resourceToFilter as keyof typeof searchHistoryMap]();
};

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
    const plexProfile = plex.getProfile();
    let resourceToFilter: string;
    if (plexProfile.profile.regionName && plexProfile.profile.cicsPlex) {
      resourceToFilter = await window.showQuickPick(["Programs", "Local Transactions", "Local Files", "Tasks", "Libraries"]);
    } else {
      resourceToFilter = await window.showQuickPick(["Regions", "Programs", "Local Transactions", "Local Files", "Tasks", "Libraries"]);
    }

    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    const resourceHistory = getSearchHistory(persistentStorage, resourceToFilter);
    const pattern = await getPatternFromFilter(resourceToFilter.slice(0, -1), resourceHistory);
    if (pattern) {
      await addSearchHistory(persistentStorage, resourceToFilter, pattern);

      chosenNode.collapsibleState = TreeItemCollapsibleState.Expanded;

      if (resourceToFilter === "Regions") {
        chosenNode.filterRegions(pattern, tree);
      } else {
        window.withProgress(
          {
            title: "Loading Resources",
            location: ProgressLocation.Notification,
            cancellable: true,
          },
          async (_, token) => {
            token.onCancellationRequested(() => { });
            for (const region of chosenNode.children) {
              if (region instanceof CICSRegionTree) {
                if (region.getIsActive()) {
                  let treeToFilter;
                  if (resourceToFilter === "Programs") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("cicstreeprogram."))[0];
                  } else if (resourceToFilter === "Local Transactions") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("cicstreetransaction."))[0];
                  } else if (resourceToFilter === "Local Files") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("cicstreelocalfile."))[0];
                  } else if (resourceToFilter === "Tasks") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("cicstreetask."))[0];
                  } else if (resourceToFilter === "Libraries") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("cicstreelibrary."))[0];
                  }
                  if (treeToFilter) {
                    treeToFilter.setFilter(pattern);
                    await treeToFilter.loadContents();
                    treeToFilter.collapsibleState = TreeItemCollapsibleState.Expanded;
                  }
                  region.collapsibleState = TreeItemCollapsibleState.Expanded;
                }
              }
            }
            tree._onDidChangeTreeData.fire(undefined);
          }
        );
      }
      tree._onDidChangeTreeData.fire(undefined);
    }
  });
}
