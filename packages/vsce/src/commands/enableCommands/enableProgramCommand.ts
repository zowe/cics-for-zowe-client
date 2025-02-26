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
import { commands, ProgressLocation, TreeView, window } from "vscode";
import { CICSCombinedProgramTree } from "../../trees/CICSCombinedTrees/CICSCombinedProgramTree";
import { CICSRegionsContainer } from "../../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../../trees/CICSRegionTree";
import { CICSTree } from "../../trees/CICSTree";
import { CICSProgramTreeItem } from "../../trees/treeItems/CICSProgramTreeItem";
import { findSelectedNodes } from "../../utils/commandUtils";
import { ICommandParams } from "../ICommandParams";
import { runPutResource } from "../../utils/resourceUtils";
import constants from "../../utils/constants";

/**
 * Performs enable on selected CICSProgram nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getEnableProgramCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableProgram", async (clickedNode) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSProgramTreeItem, clickedNode);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS program selected");
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
        token.onCancellationRequested(() => { });
        for (const index in allSelectedNodes) {
          progress.report({
            message: `Enabling ${parseInt(index) + 1} of ${allSelectedNodes.length}`,
            increment: (parseInt(index) / allSelectedNodes.length) * constants.PERCENTAGE_MAX,
          });
          const currentNode = allSelectedNodes[parseInt(index)];

          try {
            await enableProgram(currentNode.parentRegion.parentSession.session, {
              name: currentNode.program.program,
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
        // Reload contents
        for (const parentRegion of parentRegions) {
          try {
            const programTree = parentRegion.children.filter((child: any) => child.contextValue.includes("cicstreeprogram."))[0];
            // Only load contents if the tree is expanded
            if (programTree.collapsibleState === 2) {
              await programTree.loadContents();
            }
            // if node is in a plex and the plex contains the region container tree
            if (parentRegion.parentPlex && parentRegion.parentPlex.children.some((child) => child instanceof CICSRegionsContainer)) {
              const allProgramsTree = parentRegion.parentPlex.children.filter((child: any) =>
                child.contextValue.includes("cicscombinedprogramtree.")
              )[0] as CICSCombinedProgramTree;
              if (allProgramsTree.collapsibleState === 2 && allProgramsTree.getActiveFilter()) {
                await allProgramsTree.loadContents(tree);
              }
            }
          } catch (error) {
            window.showErrorMessage(
              `Something went wrong when reloading programs - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
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

function enableProgram(session: imperative.AbstractSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource({
    session: session,
    resourceName: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    params: {"criteria": `PROGRAM='${parms.name}'`}
  },{
    request: {
      action: {
        $: {
          name: "ENABLE",
        },
      },
    }
  });
}
