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
import { ProgressLocation, TreeView, commands, window } from "vscode";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes, splitCmciErrorMessage } from "../../utils/commandUtils";
import constants from "../../constants/CICS.defaults";
import { runPutResource } from "../../utils/resourceUtils";
import { ICommandParams } from "../ICommandParams";
import { TransactionMeta } from "../../doc";
import { CICSSession } from "../../resources";

export function getDisableTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.disableTransaction", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, TransactionMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS Transaction selected");
      return;
    }

    await window.withProgress(
      {
        title: "Disable",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });

        for (const node of nodes) {
          progress.report({
            message: `Disabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await disableTransaction(node.getSession(), {
              name: node.getContainedResource().meta.getName(node.getContainedResource().resource),
              cicsPlex: node.cicsplexName,
              regionName: node.regionName,
            });
          } catch (error) {
            if (error.mMessage) {
              const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);
              window.showErrorMessage(
                `Perform DISABLE on Transaction "${node.getContainedResource().meta.getName(
                  node.getContainedResource().resource
                )}" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
              );
            } else {
              window.showErrorMessage(
                `Something went wrong when performing a DISABLE - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                  /(\\n\t|\\n|\\t)/gm,
                  " "
                )}`
              );
            }
          }
        }
        tree._onDidChangeTreeData.fire(nodes[0].getParent());
      }
    );
  });
}

function disableTransaction(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_LOCAL_TRANSACTION,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `TRANID='${parms.name}'` },
    },
    {
      request: {
        action: {
          $: {
            name: "DISABLE",
          },
        },
      },
    }
  );
}
