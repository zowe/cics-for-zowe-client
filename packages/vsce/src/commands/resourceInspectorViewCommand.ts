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

import { ExtensionContext, TreeView, Uri, commands, window } from "vscode";
import { IResource } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";

export function getResourceInspectorCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inspectTreeResource", async (node: CICSResourceContainerNode<IResource>) => {
    let targetNode: CICSResourceContainerNode<IResource> = node;

    if (!targetNode) {
      if (treeview.selection.length < 1) {
        await window.showErrorMessage("No CICS resource selected");
        return;
      }

      // Gets last selected element
      targetNode = treeview.selection.pop();
      const targetNodeMeta = targetNode.getContainedResource().meta;
      const targetNodeResource = targetNode.getContainedResource().resource;

      if (!targetNodeMeta || !targetNodeResource) {
        await window.showErrorMessage("No CICS resource information available to inspect");
        return;
      }

      // If there is more than 1 selected, inform we're ignoring the others
      if (treeview.selection.length > 1) {
        window.showInformationMessage(
          "Multiple CICS resources selected. Resource '" + targetNodeMeta.getName(targetNodeResource) + "' will be inspected."
        );
      }
    }

    await getResourceViewProvider(targetNode, context);
  });
}

async function getResourceViewProvider(selectedNode: CICSResourceContainerNode<IResource>, context: ExtensionContext) {
  // Makes the "CICS Resource Inspector" tab visible in the panel
  commands.executeCommand("setContext", "cics-extension-for-zowe.showResourceInspector", true);
  // Focuses on the tab in the panel - previous command not working for me??
  commands.executeCommand("resource-inspector.focus");

  await ResourceInspectorViewProvider.getInstance(context).setResource(selectedNode.getContainedResource());
}
