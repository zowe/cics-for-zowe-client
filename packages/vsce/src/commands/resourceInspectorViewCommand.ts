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

import { ExtensionContext, TreeView, commands, window } from "vscode";
import { ResourceInspectorView } from "../trees/ResourceInspectorView";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSProgramTreeItem } from "../trees/treeItems/CICSProgramTreeItem";
import { findSelectedNodes } from "../utils/commandUtils";

export function getResourceInspectorCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.resourceInspectorView", async (node) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSProgramTreeItem, node);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS program selected");
      return;
    }
    for (const programTreeItem of allSelectedNodes) {
      await ResourceInspectorViewProvider.getInstance().setTableView(new ResourceInspectorView(context, programTreeItem));
    }
  });
}
