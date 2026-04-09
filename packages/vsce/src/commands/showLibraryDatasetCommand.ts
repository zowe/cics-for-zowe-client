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

import type { ILibraryDataset } from "@zowe/cics-for-zowe-explorer-api";
import { commands, l10n, window, type TreeView } from "vscode";
import { LibraryDatasetMeta } from "../doc";
import type { CICSResourceContainerNode } from "../trees";
import { CICSLogger } from "../utils/CICSLogger";
import { findProfileAndShowDataSet, findSelectedNodes } from "../utils/commandUtils";

/**
 * Registers a command to show a CICS library dataset in Zowe Explorer.
 *
 * This command extracts the dataset name from a selected library dataset node
 * and displays it in the Zowe Explorer MVS view, allowing users to browse
 * the dataset contents.
 *
 * @param treeview - The tree view containing CICS library dataset nodes
 * @returns - Displays the dataset in Zowe Explorer
 */
export function showLibraryDatasetCommand(treeview: TreeView<CICSResourceContainerNode<ILibraryDataset>>) {
  return commands.registerCommand("cics-extension-for-zowe.showLibraryDataset", async (node) => {
    const nodes = findSelectedNodes(treeview, LibraryDatasetMeta, node) as CICSResourceContainerNode<ILibraryDataset>[];

    if (!nodes || nodes.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Library Dataset selected"));
      return;
    }
    const selectedNode = nodes[0];
    const libraryDataset = selectedNode.getContainedResource().resource;
    const datasetName = libraryDataset.attributes.dsname;
    const regionName = selectedNode.regionName;
    const cicsProfile = selectedNode.getProfile();

    try {
      CICSLogger.debug(`Showing dataset ${datasetName} for library dataset in region ${regionName}`);
      await findProfileAndShowDataSet(cicsProfile, datasetName, regionName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      CICSLogger.error(`Failed to show dataset ${datasetName} for library dataset in region ${regionName}: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        CICSLogger.error(`Stack trace: ${error.stack}`);
      }
      window.showErrorMessage(l10n.t("Failed to show dataset: {0}", errorMessage));
    }
  });
}
