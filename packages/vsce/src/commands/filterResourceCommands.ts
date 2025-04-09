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

import { commands, TreeView } from "vscode";
import { ICICSTreeNode, IResource } from "../doc";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { getPatternFromFilter } from "../utils/filterUtils";
import { PersistentStorage } from "../utils/PersistentStorage";

// TODO: bake this into meta files so we don't specify resources here
const persistentStorage = new PersistentStorage("zowe.cics.persistent");
const mapper: { [key: string]: () => string[]; } = {
  CICSProgram: () => persistentStorage.getProgramSearchHistory(),
  CICSLocalTransaction: () => persistentStorage.getTransactionSearchHistory(),
  CICSLocalFile: () => persistentStorage.getLocalFileSearchHistory(),
  CICSTask: () => persistentStorage.getTransactionSearchHistory(),
  CICSLibrary: () => persistentStorage.getLibrarySearchHistory(),
  CICSLibraryDatasetName: () => persistentStorage.getDatasetSearchHistory(),
  CICSPipeline: () => persistentStorage.getPipelineSearchHistory(),
  CICSTCPIPService: () => persistentStorage.getTCPIPSSearchHistory(),
  CICSURIMap: () => persistentStorage.getURIMapSearchHistory(),
  CICSWebService: () => persistentStorage.getWebServiceSearchHistory(),
};

export function getFilterResourcesCommand(tree: CICSTree, treeview: TreeView<ICICSTreeNode>) {
  return commands.registerCommand("cics-extension-for-zowe.filterResources", async (node: CICSResourceContainerNode<IResource>) => {

    const pattern = await getPatternFromFilter(
      node.getChildResource().meta.humanReadableName,
      mapper[node.getChildResource().meta.resourceName]()
    );

    if (!pattern) {
      return;
    }

    node.setFilter([pattern]);
    node.description = pattern;
    tree._onDidChangeTreeData.fire(node);
    await treeview.reveal(node, { expand: true });
  });
}

export function getClearFilterCommand(tree: CICSTree) {
  return commands.registerCommand("cics-extension-for-zowe.clearFilter", (node: CICSResourceContainerNode<IResource>) => {
    node.clearFilter();
    node.description = "";
    tree._onDidChangeTreeData.fire(node);
  });
}
