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
import { imperative } from "@zowe/zowe-explorer-api";
import { ProgressLocation, TreeView, commands, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { ILocalFile, LocalFileMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes, splitCmciErrorMessage } from "../utils/commandUtils";
import { runPutResource } from "../utils/resourceUtils";
import { ICommandParams } from "../doc/commands/ICommandParams";

export function getOpenLocalFileCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.openLocalFile", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS local file selected");
      return;
    }

    await window.withProgress(
      {
        title: "Open",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        for (const node of nodes) {
          progress.report({
            message: `Opening ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          const resName = node.getContainedResourceName();
          try {
            await openLocalFile(node.getSession(), {
              name: resName,
              regionName: node.regionName,
              cicsPlex: node.cicsplexName,
            });
          } catch (error) {
            // @ts-ignore
            if (error.mMessage) {
              // @ts-ignore
              const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);
              window.showErrorMessage(
                `Perform OPEN on local file "${resName}" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
              );
            } else {
              window.showErrorMessage(
                `Something went wrong when performing an OPEN - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                  /(\\n\t|\\n|\\t)/gm,
                  " "
                )}`
              );
            }
          }
        }
        // Work out how many files to re-fetch
        const parentNode = nodes[0].getParent() as CICSResourceContainerNode<ILocalFile>;
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

function openLocalFile(session: imperative.AbstractSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
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
            name: "OPEN",
          },
        },
      },
    }
  );
}
