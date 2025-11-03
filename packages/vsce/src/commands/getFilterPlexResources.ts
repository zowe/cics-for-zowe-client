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
import * as vscode from "vscode";
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
      window.showErrorMessage(vscode.l10n.t("No 'Regions' node selected"));
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
    if (resourceToFilter === "Programs") {
      resourceHistory = PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_PROGRAM_RESOURCE);
    } else if (resourceToFilter === "Local Transactions") {
      resourceHistory = PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_LOCAL_TRANSACTION);
    } else if (resourceToFilter === "Local Files") {
      resourceHistory = PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_LOCAL_FILE);
    } else if (resourceToFilter === "Tasks") {
      resourceHistory = PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_LOCAL_TRANSACTION);
    } else if (resourceToFilter === "Libraries") {
      resourceHistory = PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_LIBRARY_RESOURCE);
    } else if (resourceToFilter === "Regions") {
      resourceHistory = PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_REGION);
    } else {
      window.showInformationMessage("No Selection Made");
      return;
    }
    const pattern = await getPatternFromFilter(resourceToFilter.slice(0, -1), resourceHistory);
    if (pattern) {
      if (resourceToFilter === "Programs") {
        await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_PROGRAM_RESOURCE, pattern);
      } else if (resourceToFilter === "Local Transactions") {
        await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_LOCAL_TRANSACTION, pattern);
      } else if (resourceToFilter === "Local Files") {
        await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_LOCAL_FILE, pattern);
      } else if (resourceToFilter === "Regions") {
        await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_REGION, pattern);
      } else if (resourceToFilter === "Tasks") {
        await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_LOCAL_TRANSACTION, pattern);
      } else if (resourceToFilter === "Libraries") {
        await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_LIBRARY_RESOURCE, pattern);
      }

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
                  let treeToFilter;
                  if (resourceToFilter === "Programs") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("CICSResourceNode.Programs."))[0];
                  } else if (resourceToFilter === "Local Transactions") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("CICSResourceNode.Transactions"))[0];
                  } else if (resourceToFilter === "Local Files") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("CICSResourceNode.Local Files"))[0];
                  } else if (resourceToFilter === "Tasks") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("CICSResourceNode.Tasks"))[0];
                  } else if (resourceToFilter === "Libraries") {
                    treeToFilter = region.children?.filter((child: any) => child.contextValue.includes("CICSResourceNode.Libraries"))[0];
                  }
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
    }
  });
}
