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
import { IJVMEndpoint, JVMEndpointMeta } from "../../doc";
import { ICommandParams } from "../../doc/commands/ICommandParams";
import { CICSTree } from "../../trees/CICSTree";
import { CICSLogger } from "../../utils/CICSLogger";
import { findSelectedNodes } from "../../utils/commandUtils";
import { runPutResource } from "../../utils/resourceUtils";

/**
 * Performs disable on selected CICSJVMEndpoint nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getDisableJVMEndpointCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand(
    "cics-extension-for-zowe.disableJVMEndpoint",
    async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, JVMEndpointMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS JVMEndpoint selected");
        return;
      }

      await window.withProgress(
        {
          title: "Disable JVM Endpoint",
          location: ProgressLocation.Notification,
          cancellable: false,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => { });

          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const resource = node.getContainedResource().resource.attributes as IJVMEndpoint;
            progress.report({
              message: `Disabling JVM Endpoint '${resource.jvmendpoint}' (${i + 1} of ${nodes.length})`,
              increment: ((i + 1) / nodes.length) * constants.PERCENTAGE_MAX,
            });

            try {
              await disableJVMEndpoint(
                node.getProfileName(),
                {
                  name: resource.jvmendpoint,
                  cicsPlex: node.cicsplexName,
                  regionName: node.regionName ?? resource.eyu_cicsname,
                } as ICommandParams,
                resource.jvmserver
              );
            } catch (error) {
              const message = `Something went wrong while disabling JVMEndpoint ${node.getContainedResourceName()}\n\n${JSON.stringify(
                error.message
              ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`;
              window.showErrorMessage(message);
              CICSLogger.error(message);
            }
          }
          tree._onDidChangeTreeData.fire(nodes[0].getParent());
        }
      );
    }
  );
}

function disableJVMEndpoint(
  profileName: string,
  parms: ICommandParams,
  jvmServerName: string
): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      profileName,
      resourceName: CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `(JVMENDPOINT='${parms.name}') AND (JVMSERVER='${jvmServerName}')` },
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