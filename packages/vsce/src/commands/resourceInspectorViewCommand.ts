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
import { findSelectedNodes } from "../utils/commandUtils";

export function getResourceInspectorCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inspectTreeResource", async (node: CICSResourceContainerNode<IResource>) => {
    let meta;
    const treeSelectionArray = [...new Set([...treeview.selection])];
    if (!node) {
      for (const res of treeSelectionArray.filter((item) => item instanceof CICSResourceContainerNode && item.getContainedResource()?.resource)) {
        meta = res.getContainedResource().meta;
      }
    } else {
      meta = node.getContainedResource().meta;
    }
    const nodes = findSelectedNodes(treeview, meta, node);
    if (!nodes || !nodes.length || treeSelectionArray.length === 0) {
      await window.showErrorMessage("No CICS resource selected");
      return;
    }
    getResourceViewProvider(nodes, context.extensionUri);
    if (treeSelectionArray.length > 1) {
      await window.showInformationMessage(
        "Multiple CICS resources selected. Resource with label '" +
          treeSelectionArray[treeSelectionArray.length - 1].getLabel() +
          "' will be inspected."
      );
    }
  });
}

function getResourceViewProvider(selectedNodes: CICSResourceContainerNode<IResource>[], extensionUri: Uri) {
  for (const item of selectedNodes) {
    const resourceViewProvider = ResourceInspectorViewProvider.getInstance(extensionUri);
    const enbededWebview = resourceViewProvider?._manager?._view;
    resourceViewProvider.reloadData(item.getContainedResource(), enbededWebview);
  }
  commands.executeCommand("setContext", "cics-extension-for-zowe.showResourceInspector", true);
  commands.executeCommand("workbench.view.extension.inspector-panel");
}
