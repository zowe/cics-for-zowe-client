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
import { CICSCombinedLocalFileTree } from "../trees/CICSCombinedTrees/CICSCombinedLocalFileTree";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSTree } from "../trees/CICSTree";
import { CICSLocalFileTreeItem } from "../trees/treeItems/CICSLocalFileTreeItem";
import { findSelectedNodes, splitCmciErrorMessage } from "../utils/commandUtils";
import constants from "../constants/CICS.defaults";
import { runPutResource } from "../utils/resourceUtils";
import { ICommandParams } from "./ICommandParams";

export function getCloseLocalFileCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.closeLocalFile", async (clickedNode) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSLocalFileTreeItem, clickedNode);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      window.showErrorMessage("No CICS local file selected");
      return;
    }
    const parentRegions: CICSRegionTree[] = [];
    let busyDecision = await window.showInformationMessage(
      `Choose one of the following for the file busy condition`,
      ...["Wait", "No Wait", "Force"]
    );
    if (busyDecision) {
      busyDecision = busyDecision.replace(" ", "").toUpperCase();

      window.withProgress(
        {
          title: "Close",
          location: ProgressLocation.Notification,
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {});
          for (const index in allSelectedNodes) {
            progress.report({
              message: `Closing ${parseInt(index) + 1} of ${allSelectedNodes.length}`,
              increment: (parseInt(index) / allSelectedNodes.length) * constants.PERCENTAGE_MAX,
            });
            const currentNode = allSelectedNodes[parseInt(index)];

            try {
              await closeLocalFile(
                currentNode.parentRegion.parentSession.session,
                {
                  name: currentNode.localFile.file,
                  regionName: currentNode.parentRegion.label,
                  cicsPlex: currentNode.parentRegion.parentPlex ? currentNode.parentRegion.parentPlex.getPlexName() : undefined,
                },
                busyDecision
              );
              if (!parentRegions.includes(currentNode.parentRegion)) {
                parentRegions.push(currentNode.parentRegion);
              }
            } catch (error) {
              // @ts-ignore
              if (error.mMessage) {
                // @ts-ignore
                const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);

                window.showErrorMessage(
                  `Perform CLOSE on local file "${
                    allSelectedNodes[parseInt(index)].localFile.file
                  }" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
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
          for (const parentRegion of parentRegions) {
            try {
              const localFileTree = parentRegion.children.filter((child: any) => child.contextValue.includes("cicstreelocalfile."))[0];
              // Only load contents if the tree is expanded
              if (localFileTree.collapsibleState === 2) {
                await localFileTree.loadContents();
              }
              // if node is in a plex and the plex contains the region container tree
              if (parentRegion.parentPlex && parentRegion.parentPlex.children.some((child) => child instanceof CICSRegionsContainer)) {
                const allLocalFileTreeTree = parentRegion.parentPlex.children.filter((child: any) =>
                  child.contextValue.includes("cicscombinedlocalfiletree.")
                )[0] as CICSCombinedLocalFileTree;
                if (allLocalFileTreeTree.collapsibleState === 2 && allLocalFileTreeTree.getActiveFilter()) {
                  await allLocalFileTreeTree.loadContents(tree);
                }
              }
            } catch (error) {
              window.showErrorMessage(
                `Something went wrong when reloading local files - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                  /(\\n\t|\\n|\\t)/gm,
                  " "
                )}`
              );
            }
          }
          tree._onDidChangeTreeData.fire(undefined);
        }
      );
    }
  });
}

async function closeLocalFile(session: imperative.AbstractSession, parms: ICommandParams, busyDecision: string): Promise<ICMCIApiResponse> {
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
