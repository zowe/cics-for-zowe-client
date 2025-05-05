import * as vscode from "vscode";
import { BottomViewProvider } from "../trees/BottomViewProvider";
import { CICSProgramTreeItem } from "../trees/treeItems/CICSProgramTreeItem";
import { findSelectedNodes } from "../utils/commandUtils";

export function getOpenBottomPanelCommand(context: vscode.ExtensionContext, treeview: vscode.TreeView<any>) {
  let bottomViewProvider: BottomViewProvider | undefined;
  let lastProgramData: Array<{ label: string; program: any }> = []; // Store the last data

  return vscode.commands.registerCommand("cics-extension-for-zowe.openBottomPanel", async (node) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSProgramTreeItem, node);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await vscode.window.showErrorMessage("No CICS program selected");
      return;
    }

    // Prepare data to send to the BottomViewProvider
    const programData = allSelectedNodes.map((programTreeItem) => ({
      label: programTreeItem.label,
      program: programTreeItem.program,
    }));

    // Check if the data is new
    const isNewData = JSON.stringify(programData) !== JSON.stringify(lastProgramData);

    if (bottomViewProvider) {
      if (isNewData) {
        bottomViewProvider.reloadData(programData); // Reload with new data
        lastProgramData = programData; // Update the last data
      }
    } else {
      // Otherwise, create a new BottomViewProvider and register it
      bottomViewProvider = new BottomViewProvider(context.extensionUri, treeview);
      bottomViewProvider.reloadData(programData);
      lastProgramData = programData; // Update the last data
      context.subscriptions.push(vscode.window.registerWebviewViewProvider(BottomViewProvider.viewType, bottomViewProvider));
    }

    // Open the bottom panel
    vscode.commands.executeCommand("setContext", "zowe.vscode-extension-for-zowe.showBottomPanel", true);
    vscode.commands.executeCommand("workbench.view.extension.bottom-panel");
  });
}
