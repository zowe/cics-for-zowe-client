import { commands, ExtensionContext, l10n, TreeView, window } from "vscode";
import { CICSRegionTree } from "../trees";
import { inspectResourceByNode } from "./inspectResourceCommandUtils";

export function getInspectTreeRegionCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inspectTreeRegion", async (node: CICSRegionTree) => {
    // if (!node) {
    //   await window.showErrorMessage(l10n.t("No CICS region selected"));
    //   return;
    // }

    // await inspectResourceByNode(context, node as any);
    let targetNode: CICSRegionTree = node;

    if (!targetNode) {
      if (treeview.selection.length < 1) {
        await window.showErrorMessage(l10n.t("No CICS resource selected"));
        return;
      }

      // Gets last selected element
      targetNode = treeview.selection.pop();
      const targetNodeMeta = targetNode.getContainedResource().meta;
      const targetNodeResource = targetNode.getContainedResource().resource;

      if (!targetNodeMeta || !targetNodeResource) {
        await window.showErrorMessage(l10n.t("No CICS region information available to inspect"));
        return;
      }

      // If there is more than 1 selected, inform we're ignoring the others
      if (treeview.selection.length > 1) {
        window.showInformationMessage(
          l10n.t("Multiple CICS regions selected. Region '{0}' will be inspected.", targetNodeMeta.getName(targetNodeResource))
        );
      }
    }
    await inspectResourceByNode(context, targetNode as any);
  });
}
