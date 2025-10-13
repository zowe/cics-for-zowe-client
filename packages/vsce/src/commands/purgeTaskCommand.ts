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
import constants from "../constants/CICS.defaults";
import { ITask, TaskMeta } from "../doc";
import { ICommandParams } from "../doc/commands/ICommandParams";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes, splitCmciErrorMessage } from "../utils/commandUtils";
import { runPutResource } from "../utils/resourceUtils";

/**
 * Purge a CICS Task and reload the CICS Task tree contents and the combined Task tree contents
 * @param tree
 * @param treeview
 * @returns
 */
export function getPurgeTaskCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.purgeTask", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, TaskMeta, clickedNode);
    if (!nodes || !nodes.length) {
      window.showErrorMessage("No CICS task selected");
      return;
    }

    let purgeType = await window.showInformationMessage(`Choose one of the following options for Purge`, ...["Purge", "Force Purge"]);
    if (!purgeType) {
      return;
    }
    purgeType = purgeType.replace(" ", "").toUpperCase();

    window.withProgress(
      {
        title: "Purge",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        for (const node of nodes) {
          progress.report({
            message: `Purging ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          const resName = node.getContainedResourceName();
          try {
            await purgeTask(
              node.getProfile(),
              {
                name: resName,
                regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
                cicsPlex: node.cicsplexName,
              },
              purgeType
            );
          } catch (error) {
            // @ts-ignore
            if (error.mMessage) {
              // @ts-ignore
              const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);
              window.showErrorMessage(
                `Perform ${purgeType?.toUpperCase()} on CICSTask "${
                  resName
                }" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
              );
            } else {
              window.showErrorMessage(
                `Something went wrong when performing a ${purgeType?.toUpperCase()} - ${JSON.stringify(
                  error,
                  Object.getOwnPropertyNames(error)
                ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`
              );
            }
          }
        }
        // Work out how many tasks to re-fetch
        const parentNode = nodes[0].getParent() as CICSResourceContainerNode<ITask>;
        let numToFetch = parentNode.children.length;
        if (!parentNode.getChildResource().resources.getFetchedAll()) {
          numToFetch -= 1;
        }
        parentNode.getChildResource().resources.setNumberToFetch(numToFetch);

        tree._onDidChangeTreeData.fire(parentNode);
      }
    );
  });
}

/**
 * CMCI Purge Task request
 * @param profile
 * @param parms
 * @param purgeType
 * @returns
 */
function purgeTask(profile: IProfileLoaded, parms: ICommandParams, purgeType: string): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      profileName: profile.name,
      resourceName: CicsCmciConstants.CICS_CMCI_TASK,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `TASK='${parms.name}'` },
    },
    {
      request: {
        action: {
          $: {
            name: "PURGE",
          },
          parameter: {
            $: {
              name: "TYPE",
              value: purgeType,
            },
          },
        },
      },
    }
  );
}
