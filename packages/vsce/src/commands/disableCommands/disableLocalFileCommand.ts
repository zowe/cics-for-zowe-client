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
import { commands, TreeView, window } from "vscode";
import { LocalFileMeta } from "../../doc/meta/localFile.meta";
import { CICSResourceContainerNode } from "../../trees";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { disableTreeItem } from "./disableResourceCommand";

export function getDisableLocalFileCommand(tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) {
  return commands.registerCommand("cics-extension-for-zowe.disableLocalFile", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, clickedNode);
    if (!nodes || !nodes.length) {
      window.showErrorMessage("No CICS local file selected");
      return;
    }

    let busyDecision = await window.showInformationMessage(
      `Choose one of the following for the file busy condition`,
      ...["Wait", "No Wait", "Force"]
    );
    if (!busyDecision) {
      return;
    }

    busyDecision = busyDecision.replace(" ", "").toUpperCase();

    await disableTreeItem(nodes, tree, undefined, undefined, { name: "BUSY", value: busyDecision });
  });
}
