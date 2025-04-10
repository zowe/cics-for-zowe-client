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
import { IJVMServer, JVMServerMeta } from "../../doc";
import { CICSSession } from "../../resources";
import { CICSResourceContainerNode } from "../../trees";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { runGetResource, runPutResource } from "../../utils/resourceUtils";
import { ICommandParams } from "../ICommandParams";

async function checkEnabled(node: CICSResourceContainerNode<IJVMServer>, cb: () => void) {
  for (let retries = 0; retries < 10; retries++) {
    const { response } = await runGetResource({
      session: node.getSession(),
      resourceName: node.getContainedResource().meta.resourceName,
      cicsPlex: node.cicsplexName,
      regionName: node.regionName,
      params: {
        criteria: `NAME=${node.getContainedResource().meta.getName(node.getContainedResource().resource)}`,
      },
    });
    if (response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "ENABLED") {
      break;
    }
    await new Promise((f) => setTimeout(f, 1000));
  }

  cb();
}
/**
 * Performs enable on selected CICSJVMServer nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getEnableJVMServerCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableJVMServer", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS JVM Servers selected");
      return;
    }

    await window.withProgress(
      {
        title: "Enable",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        for (const node of nodes) {
          progress.report({
            message: `Enabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await enableJVMServer(node.getSession(), {
              name: node.getContainedResource().meta.getName(node.getContainedResource().resource),
              regionName: node.regionName,
              cicsPlex: node.cicsplexName,
            });

            await checkEnabled(node as CICSResourceContainerNode<IJVMServer>, () => {
              // Work out how many JVM Servers to re-fetch
              const parentNode = nodes[0].getParent() as CICSResourceContainerNode<IJVMServer>;
              let numToFetch = parentNode.children.length;
              if (!parentNode.getChildResource().resources.getFetchedAll()) {
                numToFetch -= 1;
              }
              parentNode.getChildResource().resources.setNumberToFetch(numToFetch);

              tree._onDidChangeTreeData.fire(parentNode);
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
      }
    );
  });
}

function enableJVMServer(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_CMCI_JVM_SERVER,
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
