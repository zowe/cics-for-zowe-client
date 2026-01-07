import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import type { TreeView } from "vscode";
import { commands, ExtensionContext, l10n, window } from "vscode";
import { CICSRegionTree, CICSResourceContainerNode } from "../trees";
import { inspectResource, inspectResourceByName, inspectResourceByNode } from "./inspectResourceCommandUtils";

export function getInspectRegionCommand(context: ExtensionContext, treenode?: TreeView<any>) {
  return commands.registerCommand(
    "cics-extension-for-zowe.inspectRegion",
    async (node?: CICSRegionTree | CICSResourceContainerNode<any> | string) => {
      let targetNode: CICSRegionTree | CICSResourceContainerNode<any> | string | undefined = node;

      if (!targetNode && treenode) {
        if (treenode.selection.length < 1) {
          await window.showErrorMessage(l10n.t("No CICS region selected"));
          return;
        }

        targetNode = treenode.selection.pop();

        if (!targetNode || typeof (targetNode as any).getContainedResource !== "function") {
          await window.showErrorMessage(l10n.t("No CICS region information available to inspect"));
          return;
        }

        if (treenode.selection.length > 1) {
          const meta = (targetNode as any).getContainedResource().meta;
          const resource = (targetNode as any).getContainedResource().resource;
          window.showInformationMessage(l10n.t("Multiple CICS resources selected. Resource '{0}' will be inspected.", meta.getName(resource)));
        }
      }

      if (!targetNode) {
        await inspectResource(context);
        return;
      }

      if (targetNode instanceof CICSRegionTree || typeof (targetNode as any).getContainedResource === "function") {
        await inspectResourceByNode(context, targetNode as any);
        return;
      }

      if (typeof targetNode === "string") {
        await inspectResourceByName(context, targetNode, CicsCmciConstants.CICS_CMCI_MANAGED_REGION);
        return;
      }

      await inspectResource(context);
    }
  );
}
