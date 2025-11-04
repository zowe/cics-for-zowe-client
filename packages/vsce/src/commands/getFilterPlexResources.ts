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
import { ProgressLocation, TreeView, commands, l10n, window } from "vscode";
import { CICSRegionsContainer } from "../trees";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSTree } from "../trees/CICSTree";
import PersistentStorage from "../utils/PersistentStorage";
import { getPatternFromFilter } from "../utils/filterUtils";

/* helpers to reduce complexity and centralize mappings */
function getCmciKeyForLabel(label: string): string | undefined {
  switch (label) {
    case "Programs":
      return CicsCmciConstants.CICS_PROGRAM_RESOURCE;
    case "Local Transactions":
    case "Tasks":
      return CicsCmciConstants.CICS_LOCAL_TRANSACTION;
    case "Local Files":
      return CicsCmciConstants.CICS_CMCI_LOCAL_FILE;
    case "Libraries":
      return CicsCmciConstants.CICS_LIBRARY_RESOURCE;
    case "Regions":
      return CicsCmciConstants.CICS_CMCI_REGION;
    default:
      return undefined;
  }
}

function getContextIncludesForLabel(label: string): string | undefined {
  switch (label) {
    case "Programs":
      return "CICSResourceNode.Programs.";
    case "Local Transactions":
      return "CICSResourceNode.Transactions";
    case "Local Files":
      return "CICSResourceNode.Local Files";
    case "Tasks":
      return "CICSResourceNode.Tasks";
    case "Libraries":
      return "CICSResourceNode.Libraries";
    default:
      return undefined;
  }
}

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
    const plexProfile = plex.getProfile();

    const RESOURCE_CHOICES_BASE = [
      { id: "Programs", label: l10n.t("Programs") },
      { id: "Local Transactions", label: l10n.t("Local Transactions") },
      { id: "Local Files", label: l10n.t("Local Files") },
      { id: "Tasks", label: l10n.t("Tasks") },
      { id: "Libraries", label: l10n.t("Libraries") },
    ];
    const RESOURCE_CHOICES_WITH_REGIONS = [{ id: "Regions", label: l10n.t("Regions") }, ...RESOURCE_CHOICES_BASE];

    const pickList = plexProfile.profile.regionName && plexProfile.profile.cicsPlex ? RESOURCE_CHOICES_BASE : RESOURCE_CHOICES_WITH_REGIONS;
    const pickedLabel = await window.showQuickPick(pickList.map((c) => c.label));
    if (!pickedLabel) {
      return;
    }

    const resourceToFilter = pickList.find((c) => c.label === pickedLabel)?.id;
    if (!resourceToFilter) {
      window.showInformationMessage(l10n.t("No Selection Made"));
      return;
    }

    const cmciKey = getCmciKeyForLabel(resourceToFilter);
    if (!cmciKey) {
      window.showInformationMessage(l10n.t("No Selection Made"));
      return;
    }

    const resourceHistory = PersistentStorage.getSearchHistory(cmciKey);
    const pattern = await getPatternFromFilter(resourceToFilter.slice(0, -1), resourceHistory);
    if (pattern) {
      await PersistentStorage.appendSearchHistory(cmciKey, pattern);

      if (resourceToFilter === "Regions") {
        chosenNode.filterRegions(pattern, tree);
      } else {
        await window.withProgress(
          {
            title: l10n.t("Loading Resources"),
            location: ProgressLocation.Notification,
            cancellable: true,
          },
          (_, token): Thenable<unknown> => {
            token.onCancellationRequested(() => {});
            for (const region of chosenNode.children) {
              if (region instanceof CICSRegionTree) {
                if (region.getIsActive()) {
                  const contextIncludes = getContextIncludesForLabel(resourceToFilter);
                  if (contextIncludes) {
                    const treeToFilter = region.children?.filter((child: any) => child.contextValue.includes(contextIncludes))[0];
                    if (treeToFilter) {
                      // @ts-ignore
                      treeToFilter.setFilter([pattern]);
                      treeToFilter.description = pattern;
                    }
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
