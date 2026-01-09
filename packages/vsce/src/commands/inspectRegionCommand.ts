import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { commands, ExtensionContext, l10n, window } from "vscode";
import { CICSRegionTree, CICSResourceContainerNode } from "../trees";
import { inspectResourceByName, inspectResourceByNode } from "./inspectResourceCommandUtils";

export function getInspectRegionCommand(context: ExtensionContext) {
  return commands.registerCommand(
    "cics-extension-for-zowe.inspectRegion",
    async (node?: CICSRegionTree | CICSResourceContainerNode<any> | string) => {
      if (!node) {
        await window.showErrorMessage(l10n.t("No CICS region or resource specified"));
        return;
      }

      if (node instanceof CICSRegionTree || typeof (node as any).getContainedResource === "function") {
        await inspectResourceByNode(context, node as any);
        return;
      }

      if (typeof node === "string") {
        await inspectResourceByName(context, node, CicsCmciConstants.CICS_CMCI_MANAGED_REGION);
        return;
      }
    }
  );
}