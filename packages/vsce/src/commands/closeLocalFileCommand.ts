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

import { TreeView, commands, l10n, window } from "vscode";
import { LocalFileMeta } from "../doc";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

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

    const picked = await window.showInformationMessage(
      l10n.t("Choose one of the following for the file busy condition"),
      ...Object.keys(busyChoices)
    );
    if (!picked) {
      return;
    }

    const busyDecision = busyChoices[picked] ?? "WAIT";

    await actionTreeItem({
      action: "CLOSE",
      nodes,
      tree,
      parameter: {
        name: "BUSY",
        value: busyDecision,
      },
    });
  });
}
