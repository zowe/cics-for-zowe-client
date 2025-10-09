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
import { ILocalFile, LocalFileMeta } from "../doc";
import { ICommandParams } from "../doc/commands/ICommandParams";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes, splitCmciErrorMessage } from "../utils/commandUtils";
import { runPutResource } from "../utils/resourceUtils";

export function getCloseLocalFileCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.closeLocalFile", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, clickedNode);
    if (!nodes || !nodes.length) {
      window.showErrorMessage("No CICS local file selected");
      return;
    }

    let busyDecision = await window.showInformationMessage(
      `Choose one of the following for the file busy condition`,
      ...["Wait", "No Wait", "Force"]
    );
    if (!busyDecision) {
      return;
    }
    busyDecision = busyDecision.replace(" ", "").toUpperCase();

    await window.withProgress(
      {
        title: "Close",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        for (const node of nodes) {
          progress.report({
            message: `Closing ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await closeLocalFile(
              node.getProfile(),
              {
                name: node.getContainedResourceName(),
                regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
                cicsPlex: node.cicsplexName,
              },
              busyDecision
            );
          } catch (error) {
            // @ts-ignore
            if (error.mMessage) {
              // @ts-ignore
              const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);

              window.showErrorMessage(
                `Perform CLOSE on local file "${node
                  .getContainedResource()
                  .meta.getName(node.getContainedResource().resource)}" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
              );
            } else {
              window.showErrorMessage(
                `Something went wrong when performing a CLOSE - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                  /(\\n\t|\\n|\\t)/gm,
                  " "
                )}`
              );
            }
          }
        }
        // Work out how many files to re-fetch
        const parentNode = nodes[0].getParent() as CICSResourceContainerNode<ILocalFile>;
        if (parentNode) {
          let numToFetch = parentNode.children.length;
          if (!parentNode.getChildResource().resources.getFetchedAll()) {
            numToFetch -= 1;
          }
          parentNode.getChildResource().resources.setNumberToFetch(numToFetch);
        }
        tree._onDidChangeTreeData.fire(parentNode);
      }
    );
  });
}

async function closeLocalFile(profile: IProfileLoaded, parms: ICommandParams, busyDecision: string): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      profileName: profile.name,
      resourceName: CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `FILE='${parms.name}'` },
    },
    {
      request: {
        action: {
          $: {
            name: "CLOSE",
          },
          parameter: {
            $: {
              name: "BUSY",
              value: busyDecision,
            },
          },
        },
      },
    }
  );
}
