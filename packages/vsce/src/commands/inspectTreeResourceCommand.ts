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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { ExtensionContext, TreeView, commands, l10n, window } from "vscode";
import { CICSResourceContainerNode } from "../trees";
import { inspectResourceByNode } from "./inspectResourceCommandUtils";

export function getInspectTreeResourceCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inspectTreeResource", async (node: CICSResourceContainerNode<IResource>) => {
    let targetNode: CICSResourceContainerNode<IResource> = node;

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
        await window.showErrorMessage(l10n.t("No CICS resource information available to inspect"));
        return;
      }

      // If there is more than 1 selected, inform we're ignoring the others
      if (treeview.selection.length > 1) {
        const infoMsg = l10n.t("Multiple CICS resources selected. Resource '{0}' will be inspected.", targetNodeMeta.getName(targetNodeResource));
        window.showInformationMessage(infoMsg);
      }
    }
    await inspectResourceByNode(context, targetNode);
  });
}
