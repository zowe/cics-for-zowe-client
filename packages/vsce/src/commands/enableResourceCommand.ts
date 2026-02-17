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

import type { IBundle, IJVMEndpoint, IJVMServer, ILibrary, ILocalFile, IProgram, IResource, ITransaction } from "@zowe/cics-for-zowe-explorer-api";
import { type TreeView, commands, l10n, window } from "vscode";
import { BundleMeta, JVMEndpointMeta, JVMServerMeta, LibraryMeta, LocalFileMeta, ProgramMeta, TransactionMeta } from "../doc";
import type { CICSResourceContainerNode, CICSTree } from "../trees";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

export const getEnableResourceCommands = (tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) => {
  const enableProgram = async (treeNode: CICSResourceContainerNode<IProgram>) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, ProgramMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({ action: "ENABLE", nodes, tree });
  };

  const enableTransaction = async (treeNode: CICSResourceContainerNode<ITransaction>) => {
    const nodes = findSelectedNodes(treeview, TransactionMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, TransactionMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({ action: "ENABLE", nodes, tree });
  };

  const enableLocalFile = async (treeNode: CICSResourceContainerNode<ILocalFile>) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, LocalFileMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({ action: "ENABLE", nodes, tree });
  };

  const enableLibrary = async (treeNode: CICSResourceContainerNode<ILibrary>) => {
    const nodes = findSelectedNodes(treeview, LibraryMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, LibraryMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({ action: "ENABLE", nodes, tree });
  };

  const enableBundle = async (treeNode: CICSResourceContainerNode<IBundle>) => {
    const nodes = findSelectedNodes(treeview, BundleMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, BundleMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({
      action: "ENABLE",
      nodes,
      tree,
      pollCriteria: (response) => response.records?.cicsbundle?.enablestatus.toUpperCase() === "ENABLED",
    });
  };

  const enableJVMServer = async (treeNode: CICSResourceContainerNode<IJVMServer>) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, JVMServerMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({
      action: "ENABLE",
      nodes,
      tree,
      pollCriteria: (response) => response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "ENABLED",
    });
  };

  const enableJVMEndpoint = async (treeNode: CICSResourceContainerNode<IJVMEndpoint>) => {
    const nodes = findSelectedNodes(treeview, JVMEndpointMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, JVMEndpointMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({
      action: "ENABLE",
      nodes,
      tree,
      getParentResource: (node: CICSResourceContainerNode<IJVMServer>) => node.getContainedResource().resource.attributes,
      pollCriteria: (response) => response.records?.cicsjvmendpoint?.enablestatus.toUpperCase() === "ENABLED",
    });
  };

  return [
    commands.registerCommand("cics-extension-for-zowe.enableProgram", enableProgram),
    commands.registerCommand("cics-extension-for-zowe.enableTransaction", enableTransaction),
    commands.registerCommand("cics-extension-for-zowe.enableLocalFile", enableLocalFile),
    commands.registerCommand("cics-extension-for-zowe.enableLibrary", enableLibrary),
    commands.registerCommand("cics-extension-for-zowe.enableBundle", enableBundle),
    commands.registerCommand("cics-extension-for-zowe.enableJVMServer", enableJVMServer),
    commands.registerCommand("cics-extension-for-zowe.enableJVMEndpoint", enableJVMEndpoint),
  ];
};
