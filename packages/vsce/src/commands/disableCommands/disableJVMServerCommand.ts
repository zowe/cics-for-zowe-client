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
import { commands, ProgressLocation, TreeView, window } from "vscode";
import constants from "../../constants/CICS.defaults";
import { JVMServerMeta } from "../../doc";
import { ICommandParams } from "../../doc/commands/ICommandParams";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { pollForCompleteAction, runPutResource } from "../../utils/resourceUtils";
import { evaluateTreeNodes } from "../../utils/treeUtils";

/**
 * Performs disable on selected CICSJVMServer nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getDisableJVMServerCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.disableJVMServer", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS JVM Server selected");
      return;
    }

    let disableType = await window.showInformationMessage(
      `Choose how to purge tasks while disabling the JVM server`,
      ...["Phase Out", "Purge", "Force Purge", "Kill"]
    );
    if (!disableType) {
      return;
    }

    disableType = disableType.replace(" ", "").toUpperCase();

    await window.withProgress(
      {
        title: "Disable JVM Server",
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
            await disableJVMServer(
              node.getProfile(),
              {
                name: node.getContainedResourceName(),
                cicsPlex: node.cicsplexName,
                regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              },
              disableType
            );

            await pollForCompleteAction(
              node,
              (response) => {
                return response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "DISABLED";
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

function disableJVMServer(profile: IProfileLoaded, parms: ICommandParams, disableType: string): Promise<ICMCIApiResponse> {
  const allowedTypes = ["PURGE", "FORCEPURGE", "KILL"];
  const action: any = {
    $: {
      name: "DISABLE",
    },
  };

  // Only add TYPE parameter if a valid type is selected and not empty
  if (disableType && allowedTypes.includes(disableType)) {
    action.parameter = {
      $: {
        name: "PURGETYPE",
        value: disableType,
      },
    };
  }

  return runPutResource(
    {
      profileName: profile.name,
      resourceName: CicsCmciConstants.CICS_JVMSERVER_RESOURCE,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `NAME='${parms.name}'` },
    },
    {
      request: {
        action: action,
      },
    }
  );
}
