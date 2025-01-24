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

import { CicsCmciConstants, CicsCmciRestClient, ICMCIApiResponse, IGetResourceUriOptions, ILocalFile, Utils } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { commands, ProgressLocation, TreeView, window } from "vscode";
import { CICSCombinedResourceTree } from "../trees/CICSCombinedTrees/CICSCombinedResourceTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSTree } from "../trees/CICSTree";
import { CICSResourceTreeItem } from "../trees/treeItems/CICSResourceTreeItem";
import { findSelectedNodes, splitCmciErrorMessage } from "../utils/commandUtils";
import constants from "../utils/constants";
import { ICommandParams } from "./ICommandParams";

export function getOpenLocalFileCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.openLocalFile", async (clickedNode) => {
    const allSelectedNodes: CICSResourceTreeItem<ILocalFile>[] = findSelectedNodes(treeview, CICSResourceTreeItem, clickedNode);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS local file selected");
      return;
    }
    const parentRegions: CICSRegionTree[] = [];
    await window.withProgress(
      {
        title: "Open",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });
        for (const index in allSelectedNodes) {
          progress.report({
            message: `Opening ${parseInt(index) + 1} of ${allSelectedNodes.length}`,
            increment: (parseInt(index) / allSelectedNodes.length) * constants.PERCENTAGE_MAX,
          });
          const currentNode = allSelectedNodes[parseInt(index)];

          try {
            await openLocalFile(currentNode.parentRegion.parentSession.session, {
              name: currentNode.resource.file,
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
                `Perform OPEN on local file "${allSelectedNodes[parseInt(index)].resource.file
                }" failed: EXEC CICS command (${eibfnAlt}) RESP(${respAlt}) RESP2(${resp2})`
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
              )[0] as CICSCombinedResourceTree<ILocalFile>;
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
  });
}

function openLocalFile(session: imperative.AbstractSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "OPEN",
        },
      },
    },
  };

  const options: IGetResourceUriOptions = {
    "cicsPlex": parms.cicsPlex,
    "regionName": parms.regionName,
    "criteria": `FILE='${parms.name}'`
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_CMCI_LOCAL_FILE, options);

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}
