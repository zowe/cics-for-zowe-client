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

import { CicsCmciConstants, CICSSession, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { commands, ProgressLocation, TreeView, window } from "vscode";
import constants from "../../constants/CICS.defaults";
import { BundleMeta } from "../../doc";
import { ICommandParams } from "../../doc/commands/ICommandParams";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { pollForCompleteAction, runPutResource } from "../../utils/resourceUtils";
import { evaluateTreeNodes } from "../../utils/treeUtils";

/**
 * Performs disable on selected CICSBundle nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getDisableBundleCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.disableBundle", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, BundleMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS Bundles selected");
      return;
    }

    await window.withProgress(
      {
        title: "Disable",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        for (const node of nodes) {
          progress.report({
            message: `Disabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await disableBundle(node.getSession(), {
              name: node.getContainedResource().meta.getName(node.getContainedResource().resource),
              cicsPlex: node.cicsplexName,
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
            });

            tree._onDidChangeTreeData.fire(node.getParent());

            await pollForCompleteAction(
              node,
              (response) => {
                return response.records?.cicsbundle?.enablestatus.toUpperCase() === "DISABLED";
              },
              () => evaluateTreeNodes(node, tree)
            );
          } catch (error) {
            window.showErrorMessage(
              `Something went wrong when performing a disable - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
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

function disableBundle(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
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
            name: "DISABLE",
          },
        },
      },
    }
  );
}
