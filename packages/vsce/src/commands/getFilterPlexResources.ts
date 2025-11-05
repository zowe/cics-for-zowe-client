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

/* Resource metas — use <metafile>.resourceName as id and <metafile>.humanReadableNameSingular for display.
   Add cmciKey and contextIncludes so callers can use a single source of truth. */
type ResourceMeta = {
  id: string;
  resourceName: string;
  humanReadableNameSingular: string; // localization key
  cmciKey: string;
  contextIncludes?: string;
  supportsRegions?: boolean;
};

const RESOURCE_METAS: ResourceMeta[] = [
  {
    id: "Programs",
    resourceName: "program",
    humanReadableNameSingular: "Programs",
    cmciKey: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
    contextIncludes: "CICSResourceNode.Programs.",
  },
  {
    id: "Local Transactions",
    resourceName: "transaction",
    humanReadableNameSingular: "Local Transactions",
    cmciKey: CicsCmciConstants.CICS_LOCAL_TRANSACTION,
    contextIncludes: "CICSResourceNode.Transactions",
  },
  {
    id: "Local Files",
    resourceName: "localfile",
    humanReadableNameSingular: "Local Files",
    cmciKey: CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
    contextIncludes: "CICSResourceNode.Local Files",
  },
  {
    id: "Tasks",
    resourceName: "task",
    humanReadableNameSingular: "Tasks",
    cmciKey: CicsCmciConstants.CICS_LOCAL_TRANSACTION,
    contextIncludes: "CICSResourceNode.Tasks",
  },
  {
    id: "Libraries",
    resourceName: "library",
    humanReadableNameSingular: "Libraries",
    cmciKey: CicsCmciConstants.CICS_LIBRARY_RESOURCE,
    contextIncludes: "CICSResourceNode.Libraries",
  },
  {
    id: "Regions",
    resourceName: "region",
    humanReadableNameSingular: "Regions",
    cmciKey: CicsCmciConstants.CICS_CMCI_REGION,
    supportsRegions: true,
  },
];

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

    // Build pick list from metas. If profile lacks plex/region info, include Regions option.
    const metasForPick =
      plexProfile.profile.regionName && plexProfile.profile.cicsPlex ? RESOURCE_METAS.filter((m) => !m.supportsRegions) : RESOURCE_METAS;
    const choices = metasForPick.map((m) => ({ id: m.id, label: l10n.t(m.humanReadableNameSingular) }));

    const pickedLabel = await window.showQuickPick(choices.map((c) => c.label));
    if (!pickedLabel) {
      return;
    }

    const chosenMeta = RESOURCE_METAS.find((m) => l10n.t(m.humanReadableNameSingular) === pickedLabel);
    if (!chosenMeta) {
      window.showInformationMessage(l10n.t("No Selection Made"));
      return;
    }

    const resourceHistory = PersistentStorage.getSearchHistory(chosenMeta.cmciKey);
    const pattern = await getPatternFromFilter(chosenMeta.resourceName, resourceHistory);
    if (!pattern) {
      return;
    }

    await PersistentStorage.appendSearchHistory(chosenMeta.cmciKey, pattern);

    if (chosenMeta.supportsRegions) {
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
                const contextIncludes = chosenMeta.contextIncludes;
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
  });
}
