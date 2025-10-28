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

import { IJVMServer, IResource } from "@zowe/cics-for-zowe-explorer-api";
import { commands, TreeView, window } from "vscode";
import { BundleMeta, JVMEndpointMeta, JVMServerMeta, LibraryMeta, LocalFileMeta, ProgramMeta, TransactionMeta } from "../doc";
import { CICSResourceContainerNode, CICSTree } from "../trees";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

export const getEnableResourceCommands = (tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) => {

  return [
    commands.registerCommand("cics-extension-for-zowe.enableProgram", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, ProgramMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS program selected");
        return;
      }

      await actionTreeItem({ action: "ENABLE", nodes, tree });
    }),

    commands.registerCommand("cics-extension-for-zowe.enableTransaction", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, TransactionMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS transaction selected");
        return;
      }

      await actionTreeItem({ action: "ENABLE", nodes, tree });
    }),

    commands.registerCommand("cics-extension-for-zowe.enableLocalFile", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, LocalFileMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS Local File selected");
        return;
      }

      await actionTreeItem({ action: "ENABLE", nodes, tree });
    }),

    commands.registerCommand("cics-extension-for-zowe.enableLibrary", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, LibraryMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS Library selected");
        return;
      }

      await actionTreeItem({ action: "ENABLE", nodes, tree });
    }),

    commands.registerCommand("cics-extension-for-zowe.enableBundle", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, BundleMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS Bundles selected");
        return;
      }

      await actionTreeItem({
        action: "ENABLE",
        nodes,
        tree,
        pollCriteria: (response) => response.records?.cicsbundle?.enablestatus.toUpperCase() === "ENABLED"
      });
    }),

    commands.registerCommand("cics-extension-for-zowe.enableJVMServer", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS JVM server selected");
        return;
      }

      await actionTreeItem({
        action: "ENABLE",
        nodes,
        tree,
        pollCriteria: (response) => response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "ENABLED"
      });
    }),

    commands.registerCommand("cics-extension-for-zowe.enableJVMEndpoint", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, JVMEndpointMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS JVMEndpoint selected");
        return;
      }

      await actionTreeItem({
        action: "ENABLE",
        nodes,
        tree,
        getParentResource: (node: CICSResourceContainerNode<IJVMServer>) => node.getContainedResource().resource.attributes,
        pollCriteria: (response) => response.records?.cicsjvmendpoint?.enablestatus.toUpperCase() === "ENABLED"
      });
    }),
  ];
};