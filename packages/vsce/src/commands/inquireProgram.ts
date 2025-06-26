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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { commands, TreeView, window } from "vscode";
import { IProgram, IResource, ITransaction, TransactionMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes, getResourceTree } from "../utils/commandUtils";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";

/**
 * Inquire the associated transaction tree item from a task tree item
 */
export function getInquireProgramCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inquireProgram", async (node) => {
    const msg = "CICS Program resources are not visible. Enable them from your VS Code settings.";
    if (!openSettingsForHiddenResourceType(msg, "Program")) {
      return;
    }

    const nodes = findSelectedNodes(treeview, TransactionMeta, node) as CICSResourceContainerNode<ITransaction>[];
    if (!nodes || !nodes.length) {
      window.showErrorMessage("No CICS Transaction selected");
      return;
    }

    let programTree: CICSResourceContainerNode<IProgram> | undefined;
    const label = nodes[0].getParent().label;

    //if the label is All Local Transactions, we need to get the program tree from the regions node
    if (label === "All Local Transactions") {
      programTree = await getResourceTree<IProgram>(treeview, nodes, CicsCmciConstants.CICS_PROGRAM_RESOURCE);
    } else {
      programTree = nodes[0]
        .getParent()
        .getParent()
        .children.filter(
          (child: CICSResourceContainerNode<IResource>) => child.getChildResource().meta.resourceName === CicsCmciConstants.CICS_PROGRAM_RESOURCE
        )[0] as CICSResourceContainerNode<IProgram>;
    }

    const pattern = nodes.map((n) => n.getContainedResource().resource.attributes.program);

    programTree.setFilter(pattern);
    programTree.description = pattern.join(" OR ");
    tree._onDidChangeTreeData.fire(programTree);
    await treeview.reveal(programTree, { expand: true });
  });
}
