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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { CICSResourceContainerNode, CICSTree } from "../trees";

export function evaluateTreeNodes<T extends IResource>(node: CICSResourceContainerNode<T>, tree: CICSTree) {
  const parentNode = node.getParent() as CICSResourceContainerNode<T>;
  if (parentNode) {
    let numToFetch = parentNode.children.length;
    if (!parentNode.getChildResource().resources.getFetchedAll()) {
      numToFetch -= 1;
    }
    parentNode.getChildResource().resources.setNumberToFetch(numToFetch);
  }
  tree._onDidChangeTreeData.fire(parentNode);
}
