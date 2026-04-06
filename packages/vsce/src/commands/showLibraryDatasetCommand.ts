import type { ILibraryDataset } from "@zowe/cics-for-zowe-explorer-api";
import { commands, l10n, window, type TreeView } from "vscode";
import { LibraryDatasetMeta } from "../doc";
import type { CICSResourceContainerNode } from "../trees";
import { CICSLogger } from "../utils/CICSLogger";
import { findProfileAndShowDataSet, findSelectedNodes } from "../utils/commandUtils";

export function showLibraryDatasetCommand(treeview: TreeView<any>) {
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
