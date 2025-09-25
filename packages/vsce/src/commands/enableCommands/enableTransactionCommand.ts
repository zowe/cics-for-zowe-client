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

import { CicsCmciConstants, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { IProfileLoaded } from "@zowe/imperative";
import { ProgressLocation, TreeView, commands, window } from "vscode";
import constants from "../../constants/CICS.defaults";
import { TransactionMeta } from "../../doc";
import { ICommandParams } from "../../doc/commands/ICommandParams";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { runPutResource } from "../../utils/resourceUtils";

export function getEnableTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableTransaction", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, TransactionMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS transaction selected");
      return;
    }

    await window.withProgress(
      {
        title: "Enable",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        for (const node of nodes) {
          progress.report({
            message: `Enabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await enableTransaction(node.getProfile(), {
              name: node.getContainedResourceName(),
              cicsPlex: node.cicsplexName,
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
            });
          } catch (error) {
            window.showErrorMessage(
              `Something went wrong when performing an ENABLE - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                /(\\n\t|\\n|\\t)/gm,
                " "
              )}`
            );
          }
        }
        tree._onDidChangeTreeData.fire(nodes[0].getParent());
      }
    );
  });
}

function enableTransaction(profile: IProfileLoaded, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      profileName: profile.name,
      resourceName: CicsCmciConstants.CICS_LOCAL_TRANSACTION,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `TRANID='${parms.name}'` },
    },
    {
      request: {
        action: {
          $: {
            name: "ENABLE",
          },
        },
      },
    }
  );
}
