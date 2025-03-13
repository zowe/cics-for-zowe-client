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

import { TreeView } from "vscode";
import { IResource, IResourceMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";

/**
 * Returns an array of selected nodes in the current treeview.
 * @param treeview - Tree View of the required view
 * @param instanceOf - Instance of the node to include in the selection
 * @param clickedNode - Node that was clicked right before the command was executed
 * @return Array of selected nodes in the treeview.
 */
export function findSelectedNodes(
  treeview: TreeView<CICSResourceContainerNode<IResource>>,
  expectedMeta: IResourceMeta<IResource>,
  clickedNode?: CICSResourceContainerNode<IResource>
): CICSResourceContainerNode<IResource>[] {
  /**
   * - Clicked node NOT in selection, return clicked node only
   * - Clicked node in selection, return selection [filtered by meta]
   * - NOT clicked node, return selection as run from cmd palette [filtered by meta]
   */

  const selectedNodes = treeview.selection;

  if (!clickedNode) {
    return selectedNodes.filter((node) => node.getContainedResource().meta === expectedMeta);
  }

  if (selectedNodes.includes(clickedNode)) {
    return selectedNodes.filter((node) => node.getContainedResource().meta === expectedMeta);
  } else {
    return [clickedNode];
  }
}

/**
 * Split error messages from Zowe CICS plugin's Cmci REST client
 * @param message
 * @returns
 */
export function splitCmciErrorMessage(message: any) {
  const messageArr = message.split(" ").join("").split("\n");
  let resp;
  let resp2;
  let respAlt;
  let eibfnAlt;
  for (const val of messageArr) {
    const values = val.split(":");
    if (values[0] === "resp") {
      resp = values[1];
    } else if (values[0] === "resp2") {
      resp2 = values[1];
    } else if (values[0] === "resp_alt") {
      respAlt = values[1];
    } else if (values[0] === "eibfn_alt") {
      eibfnAlt = values[1];
    }
  }
  return [resp, resp2, respAlt, eibfnAlt];
}

export function toArray<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}
