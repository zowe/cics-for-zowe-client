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
import { IResource } from "../../doc";
import { LocalFileMeta } from "../../doc/meta/localFile.meta";
import { CICSResourceContainerNode } from "../../trees";
import { CICSTree } from "../../trees/CICSTree";
import { findSelectedNodes } from "../../utils/commandUtils";
import { runPutResource } from "../../utils/resourceUtils";
import { ICommandParams } from "../../doc/commands/ICommandParams";

export function getEnableLocalFileCommand(tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) {
  return commands.registerCommand("cics-extension-for-zowe.enableLocalFile", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS Local File selected");
      return;
    }

    window.withProgress(
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
            await enableLocalFile(node.getSession(), {
              name: node.getContainedResourceName(),
              cicsPlex: node.cicsplexName,
              regionName: node.regionName,
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

function enableLocalFile(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `FILE='${parms.name}'` },
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
