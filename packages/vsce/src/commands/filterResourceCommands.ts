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
const mapper: { [key: string]: { get: () => string[]; update: (pattern: string) => Promise<void> } } = {
  CICSProgram: {
    get: () => persistentStorage.getProgramSearchHistory(),
    update: (pattern: string) => persistentStorage.addProgramSearchHistory(pattern),
  },
  CICSLocalTransaction: {
    get: () => persistentStorage.getTransactionSearchHistory(),
    update: (pattern: string) => persistentStorage.addTransactionSearchHistory(pattern),
  },
  CICSLocalFile: {
    get: () => persistentStorage.getLocalFileSearchHistory(),
    update: (pattern: string) => persistentStorage.addLocalFileSearchHistory(pattern),
  },
  CICSTask: {
    get: () => persistentStorage.getTransactionSearchHistory(),
    update: (pattern: string) => persistentStorage.addTransactionSearchHistory(pattern),
  },
  CICSLibrary: {
    get: () => persistentStorage.getLibrarySearchHistory(),
    update: (pattern: string) => persistentStorage.addLibrarySearchHistory(pattern),
  },
  CICSLibraryDatasetName: {
    get: () => persistentStorage.getDatasetSearchHistory(),
    update: (pattern: string) => persistentStorage.addDatasetSearchHistory(pattern),
  },
  CICSPipeline: {
    get: () => persistentStorage.getPipelineSearchHistory(),
    update: (pattern: string) => persistentStorage.addPipelineSearchHistory(pattern),
  },
  CICSTCPIPService: {
    get: () => persistentStorage.getTCPIPSSearchHistory(),
    update: (pattern: string) => persistentStorage.addTCPIPSSearchHistory(pattern),
  },
  CICSURIMap: {
    get: () => persistentStorage.getURIMapSearchHistory(),
    update: (pattern: string) => persistentStorage.addURIMapsSearchHistory(pattern),
  },
  CICSWebService: {
    get: () => persistentStorage.getWebServiceSearchHistory(),
    update: (pattern: string) => persistentStorage.addWebServiceSearchHistory(pattern),
  },
};

export function getFilterResourcesCommand(tree: CICSTree, treeview: TreeView<ICICSTreeNode>) {
  return commands.registerCommand("cics-extension-for-zowe.filterResources", async (node: CICSResourceContainerNode<IResource>) => {
    const pattern = await getPatternFromFilter(
      node.getChildResource().meta.humanReadableName,
      mapper[node.getChildResource().meta.resourceName].get()
    );

    if (!pattern) {
      return;
    }

    await mapper[node.getChildResource().meta.resourceName].update(pattern);
    node.setFilter([pattern]);
    node.description = pattern;
    tree._onDidChangeTreeData.fire(node);
    await treeview.reveal(node, { expand: true });
  });
}

export function getClearFilterCommand(tree: CICSTree) {
  return commands.registerCommand("cics-extension-for-zowe.clearFilter", async (node: CICSResourceContainerNode<IResource>) => {
    await node.clearFilter();
    node.description = "";
    tree._onDidChangeTreeData.fire(node);
  });
}
