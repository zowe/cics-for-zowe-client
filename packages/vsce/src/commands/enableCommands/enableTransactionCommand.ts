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
import { CICSCombinedTransactionsTree } from "../../trees/CICSCombinedTrees/CICSCombinedTransactionTree";
import { CICSRegionTree } from "../../trees/CICSRegionTree";
import { CICSRegionsContainer } from "../../trees/CICSRegionsContainer";
import { CICSTree } from "../../trees/CICSTree";
import { CICSTransactionTreeItem } from "../../trees/treeItems/CICSTransactionTreeItem";
import { findSelectedNodes } from "../../utils/commandUtils";
import constants from "../../utils/constants";
import { runPutResource } from "../../utils/resourceUtils";
import { ICommandParams } from "../ICommandParams";

export function getEnableTransactionCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableTransaction", async (clickedNode) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSTransactionTreeItem, clickedNode);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS transaction selected");
      return;
    }
    const parentRegions: CICSRegionTree[] = [];

    await window.withProgress(
      {
        title: "Enable",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});
        for (const index in allSelectedNodes) {
          progress.report({
            message: `Enabling ${parseInt(index) + 1} of ${allSelectedNodes.length}`,
            increment: (parseInt(index) / allSelectedNodes.length) * constants.PERCENTAGE_MAX,
          });
          const currentNode = allSelectedNodes[parseInt(index)];

          try {
            await enableTransaction(currentNode.parentRegion.parentSession.session, {
              name: currentNode.transaction.tranid,
              regionName: currentNode.parentRegion.label,
              cicsPlex: currentNode.parentRegion.parentPlex ? currentNode.parentRegion.parentPlex.getPlexName() : undefined,
            });
            if (!parentRegions.includes(currentNode.parentRegion)) {
              parentRegions.push(currentNode.parentRegion);
            }
          } catch (error) {
            window.showErrorMessage(
              `Something went wrong when performing an ENABLE - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                /(\\n\t|\\n|\\t)/gm,
                " "
              )}`
            );
          }
        }
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
              )[0] as CICSCombinedTransactionsTree;
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

function enableTransaction(session: imperative.AbstractSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_LOCAL_TRANSACTION,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `TRANID='${parms.name}'` },
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
