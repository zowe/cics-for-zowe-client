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
import { ProgressLocation, type TreeView, commands, l10n, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { LocalFileMeta } from "../doc";
import { CICSErrorHandler } from "../errors/CICSErrorHandler";
import { SessionHandler } from "../resources";
import type { CICSTree } from "../trees/CICSTree";
import type { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { findSelectedNodes } from "../utils/commandUtils";
import { evaluateTreeNodes } from "../utils/treeUtils";

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

    await window.withProgress(
      {
        title: l10n.t("Closing"),
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        const nodesToRefresh = new Set();

        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i] as CICSResourceContainerNode<ILocalFile>;
          progress.report({
            message: l10n.t("{0} of {1}", i + 1, nodes.length),
            increment: (1 / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            const profile = SessionHandler.getInstance().getProfile(node.getProfileName());
            const session = SessionHandler.getInstance().getSession(profile);

            const response = await closeLocalFile(session, {
              name: node.getContainedResource().resource.attributes.file,
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              cicsPlex: node.cicsplexName,
              busy: busyDecision,
            });

            nodesToRefresh.add(node.getParent());
            evaluateTreeNodes(node, response, node.getContainedResource().meta);
          } catch (error) {
            CICSErrorHandler.handleCMCIRestError(error);
          }
        }
        nodesToRefresh.forEach((v) => {
          tree.refresh(v);
        });
      }
    );
  });
}
