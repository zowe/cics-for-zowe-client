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

import type { ILocalFile } from "@zowe/cics-for-zowe-explorer-api";
import { closeLocalFile } from "@zowe/cics-for-zowe-sdk";
import { type TreeView, commands, l10n, window } from "vscode";
import { LocalFileMeta } from "../doc";
import type { CICSTree } from "../trees/CICSTree";
import type { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

/**
 * Registers the command to close CICS local files from the VS Code tree view
 * @param tree - The CICS tree to refresh after closing
 * @param treeview - The tree view containing selected nodes
 * @returns Disposable command registration
 */
export function getCloseLocalFileCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.closeLocalFile", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, clickedNode);
    if (!nodes || !nodes.length) {
      window.showErrorMessage(l10n.t("No CICS local file selected"));
      return;
    }

    const busyChoices: Record<string, string> = {
      [l10n.t("Wait")]: "WAIT",
      [l10n.t("No Wait")]: "NOWAIT",
      [l10n.t("Force")]: "FORCE",
    };

    const selectedBusyOption = await window.showInformationMessage(
      l10n.t("Choose one of the following for the file busy condition"),
      ...Object.keys(busyChoices)
    );
    if (!selectedBusyOption) {
      return;
    }

    await actionTreeItem({
      action: "CLOSE",
      nodes,
      tree,
      parameter: { name: "busy", value: busyChoices[selectedBusyOption] },
      customAction: closeLocalFile,
      getResourceName: (node) => (node as CICSResourceContainerNode<ILocalFile>).getContainedResource().resource.attributes.file,
    });
  });
}
