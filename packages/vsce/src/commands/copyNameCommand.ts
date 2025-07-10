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

import { ExtensionContext, TreeView, commands, window, env } from "vscode";
import { IResource } from "../doc";
import { CICSResourceContainerNode } from "../trees";

export function getCopyNameCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.copyNameCommand", async (node: CICSResourceContainerNode<IResource>) => {
    let targetNode: CICSResourceContainerNode<IResource> = node;

    if (!targetNode) {
      if (treeview.selection.length < 1) {
        await window.showErrorMessage("No CICS resource selected");
        return;
      }

      targetNode = treeview.selection.pop();
    }

    const targetNodeMeta = targetNode.getContainedResource().meta;
    const targetNodeResource = targetNode.getContainedResource().resource;

    if (!targetNodeMeta || !targetNodeResource) {
      await window.showErrorMessage("No CICS resource information available to inspect");
      return;
    }

    await env.clipboard.writeText(targetNodeMeta.getLabel(targetNodeResource));
  });
}
