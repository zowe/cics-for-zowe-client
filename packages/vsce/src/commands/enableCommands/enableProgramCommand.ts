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

import { CICSSession, CicsCmciConstants, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { ProgressLocation, TreeView, commands, window } from "vscode";
import constants from "../../constants/CICS.defaults";
import { ProgramMeta } from "../../doc";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { runPutResource } from "../../utils/resourceUtils";
import { ICommandParams } from "../../doc/commands/ICommandParams";

/**
 * Performs enable on selected CICSProgram nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getEnableProgramCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableProgram", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS program selected");
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
            await enableProgram(node.getSession(), {
              name: node.getContainedResourceName(),
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              cicsPlex: node.cicsplexName,
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

function enableProgram(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `PROGRAM='${parms.name}'` },
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
