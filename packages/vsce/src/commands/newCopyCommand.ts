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

import { programNewcopy } from "@zowe/cics-for-zowe-sdk";
import { commands, ProgressLocation, TreeView, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { IProgram, ProgramMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes, splitCmciErrorMessage } from "../utils/commandUtils";

/**
 * Performs new copy on selected CICSProgram nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getNewCopyCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.newCopyProgram", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS program selected");
      return;
    }

    await window.withProgress(
      {
        title: "New Copy",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        for (const node of nodes) {
          progress.report({
            message: `New Copying ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await programNewcopy(node.getSession(), {
              name: node.getContainedResourceName(),
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              cicsPlex: node.cicsplexName,
            });
          } catch (error) {
            if (error.mMessage) {
              const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);
              window.showErrorMessage(
                `Perform NEWCOPY on Program "${node
                  .getContainedResource()
                  .meta.getName(node.getContainedResource().resource)}" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
              );
            } else {
              window.showErrorMessage(
                `Something went wrong when performing a NEWCOPY - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                  /(\\n\t|\\n|\\t)/gm,
                  " "
                )}`
              );
            }
          }
        }

        // Work out how many programs to re-fetch
        const parentNode = nodes[0].getParent() as CICSResourceContainerNode<IProgram>;
        let numToFetch = parentNode.children.length;
        if (!parentNode.getChildResource().resources.getFetchedAll()) {
          numToFetch -= 1;
        }
        parentNode.setNumberToFetch(numToFetch);

        tree._onDidChangeTreeData.fire(parentNode);
      }
    );
  });
}
