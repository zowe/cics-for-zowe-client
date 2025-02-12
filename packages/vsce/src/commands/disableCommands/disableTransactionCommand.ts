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

import { CicsCmciConstants, CicsCmciRestClient, ICMCIApiResponse, IGetResourceUriOptions, ITransaction, Utils } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { commands, ProgressLocation, TreeView, window } from "vscode";
import { CICSCombinedResourceTree } from "../../trees/CICSCombinedTrees/CICSCombinedResourceTree";
import { CICSRegionsContainer } from "../../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../../trees/CICSRegionTree";
import { CICSTree } from "../../trees/CICSTree";
import { CICSResourceTreeItem } from "../../trees/treeItems/CICSResourceTreeItem";
import { findSelectedNodes, splitCmciErrorMessage } from "../../utils/commandUtils";
import constants from "../../utils/constants";
import { ICommandParams } from "../ICommandParams";

export function getDisableTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.disableTransaction", async (clickedNode) => {
    const allSelectedNodes: CICSResourceTreeItem<ITransaction>[] = findSelectedNodes(treeview, CICSResourceTreeItem, clickedNode);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS Transaction selected");
      return;
    }
    const parentRegions: CICSRegionTree[] = [];
    await window.withProgress(
      {
        title: "Disable",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });
        for (const index in allSelectedNodes) {
          progress.report({
            message: `Disabling ${parseInt(index) + 1} of ${allSelectedNodes.length}`,
            increment: (parseInt(index) / allSelectedNodes.length) * constants.PERCENTAGE_MAX,
          });
          const currentNode = allSelectedNodes[parseInt(index)];


          try {
            await disableTransaction(currentNode.parentRegion.parentSession.session, {
              name: currentNode.resource.tranid,
              regionName: currentNode.parentRegion.region.applid,
              cicsPlex: currentNode.parentRegion.parentPlex ? currentNode.parentRegion.parentPlex.getPlexName() : undefined,
            });
            if (!parentRegions.includes(currentNode.parentRegion)) {
              parentRegions.push(currentNode.parentRegion);
            }
          } catch (error) {
            // @ts-ignore
            if (error.mMessage) {
              // @ts-ignore
              const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);
              window.showErrorMessage(
                `Perform DISABLE on Transaction "${allSelectedNodes[parseInt(index)].resource.tranid
                }" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
              );
            } else {
              window.showErrorMessage(
                `Something went wrong when performing a DISABLE - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                  /(\\n\t|\\n|\\t)/gm,
                  " "
                )}`
              );
            }
          }
        }
        // Reload contents
        for (const parentRegion of parentRegions) {
          try {
            const transactionTree = parentRegion.children.filter((child: any) => child.contextValue.includes("cicstreetransaction."))[0];
            // Only load contents if the tree is expanded
            if (transactionTree.collapsibleState === 2) {
              await transactionTree.loadContents();
            }
            // if node is in a plex and the plex contains the region container tree
            if (parentRegion.parentPlex && parentRegion.parentPlex.children.some((child) => child instanceof CICSRegionsContainer)) {
              const allTransactionTree = parentRegion.parentPlex.children.filter((child: any) =>
                child.contextValue.includes("cicscombinedtransactiontree.")
              )[0] as CICSCombinedResourceTree<ITransaction>;
              if (allTransactionTree.collapsibleState === 2 && allTransactionTree.getActiveFilter()) {
                await allTransactionTree.loadContents(tree);
              }
            }
          } catch (error) {
            window.showErrorMessage(
              `Something went wrong when reloading transactions - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                /(\\n\t|\\n|\\t)/gm,
                " "
              )}`
            );
          }
        }
        tree._onDidChangeTreeData.fire(undefined);
      }
    );
  });
}

function disableTransaction(
  session: imperative.AbstractSession,
  parms: ICommandParams
): Promise<ICMCIApiResponse> {
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "DISABLE",
        },
      },
    },
  };

  const options: IGetResourceUriOptions = {
    "cicsPlex": parms.cicsPlex,
    "regionName": parms.regionName,
    "criteria": `TRANID='${parms.name}'`
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_LOCAL_TRANSACTION, options);

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}
