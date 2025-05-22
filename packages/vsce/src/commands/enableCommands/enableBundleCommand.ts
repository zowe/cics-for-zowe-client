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
import constants from "../../constants/CICS.defaults";
import { BundleMeta } from "../../doc";
import { CICSSession } from "../../resources";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { pollForCompleteAction, runPutResource } from "../../utils/resourceUtils";
import { ICommandParams } from "../ICommandParams";
import { evaluateTreeNodes } from "../../utils/treeUtils";

/**
 * Performs enable on selected CICSBundle nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getEnableBundleCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableBundle", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, BundleMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS Bundles selected");
      return;
    }

    await window.withProgress(
      {
        title: "Enable",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });

        for (const node of nodes) {
          progress.report({
            message: `Enabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await enableBundle(node.getSession(), {
              name: node.getContainedResource().meta.getName(node.getContainedResource().resource),
              regionName: node.regionName,
              cicsPlex: node.cicsplexName,
            });

            await pollForCompleteAction(node,
              (response) => { return response.records?.cicsbundle?.enablestatus.toUpperCase() === "ENABLED"; },
              () => evaluateTreeNodes(node, tree)
            );
          } catch (error) {
            window.showErrorMessage(
              `Something went wrong when performing an ENABLE - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                /(\\n\t|\\n|\\t)/gm,
                " "
              )}`
            );
          }
        }
      }
    );
  });
}

function enableBundle(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_CMCI_BUNDLE,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `NAME='${parms.name}'` },
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
