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
import { ProgressLocation, TreeView, commands, window } from "vscode";
import constants from "../../constants/CICS.defaults";
import { JVMServerMeta } from "../../doc";
import { ICommandParams } from "../../doc/commands/ICommandParams";
import { CICSTree } from "../../trees/CICSTree";
import { CICSLogger } from "../../utils/CICSLogger";
import { findSelectedNodes } from "../../utils/commandUtils";
import { runPutResource } from "../../utils/resourceUtils";

/**
 * Performs enable on selected JVM Server nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getEnableJVMServerCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableJVMServer", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS JVM server selected");
      return;
    }

    await window.withProgress(
      {
        title: "Enable",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });

        for (const node of nodes) {
          progress.report({
            message: `Enabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await enableJVMServer(node.getSession(), {
              name: node.getContainedResourceName(),
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              cicsPlex: node.cicsplexName,
            });
          } catch (error) {
            const message = `Something went wrong while enabling JVM server ${node.getContainedResourceName()}\n\n${JSON.stringify(
              error.message
            ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`;
            window.showErrorMessage(message);
            CICSLogger.error(message);
          }
        }
        tree._onDidChangeTreeData.fire(nodes[0].getParent());
      }
    );
  });
}

function enableJVMServer(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_JVMSERVER_RESOURCE,
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
