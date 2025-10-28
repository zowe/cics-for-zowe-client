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

export const getDisableResourceCommands = (tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) => {

  return [
    commands.registerCommand("cics-extension-for-zowe.disableProgram", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, ProgramMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS program selected");
        return;
      }

      await actionTreeItem({ action: "DISABLE", nodes, tree });
    }),

    commands.registerCommand("cics-extension-for-zowe.disableTransaction", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, TransactionMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS Transaction selected");
        return;
      }

      await actionTreeItem({ action: "DISABLE", nodes, tree });
    }),

    commands.registerCommand("cics-extension-for-zowe.disableLibrary", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, LibraryMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS Library selected");
        return;
      }

      await actionTreeItem({ action: "DISABLE", nodes, tree });
    }),

    commands.registerCommand("cics-extension-for-zowe.disableBundle", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, BundleMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS Bundles selected");
        return;
      }

      await actionTreeItem({
        action: "DISABLE",
        nodes,
        tree,
        pollCriteria: (response) => response.records?.cicsbundle?.enablestatus.toUpperCase() === "DISABLED"
      });
    }),

    commands.registerCommand("cics-extension-for-zowe.disableLocalFile", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, LocalFileMeta, clickedNode);
      if (!nodes || !nodes.length) {
        window.showErrorMessage("No CICS local file selected");
        return;
      }

      const busyDecision = await window.showInformationMessage(
        `Choose one of the following for the file busy condition`,
        ...["Wait", "No Wait", "Force"]
      );
      if (!busyDecision) {
        return;
      }

      await actionTreeItem({
        action: "DISABLE",
        nodes,
        tree,
        parameter: { name: "BUSY", value: busyDecision.replace(" ", "").toUpperCase() }
      });
    }),

    commands.registerCommand("cics-extension-for-zowe.disableJVMEndpoint", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, JVMEndpointMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS JVMEndpoint selected");
        return;
      }

      await actionTreeItem({
        action: "DISABLE",
        nodes,
        tree,
        getParentResource: (node: CICSResourceContainerNode<IJVMServer>) => node.getContainedResource().resource.attributes,
        pollCriteria: (response) => response.records?.cicsjvmendpoint?.enablestatus.toUpperCase() === "DISABLED"
      });
    }),

    commands.registerCommand("cics-extension-for-zowe.disableJVMServer", async (clickedNode) => {
      const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
      if (!nodes || !nodes.length) {
        await window.showErrorMessage("No CICS JVM Server selected");
        return;
      }

      const disableType = await window.showInformationMessage(
        `Choose how to purge tasks while disabling the JVM server`,
        ...["Phase Out", "Purge", "Force Purge", "Kill"]
      );
      if (!disableType) {
        return;
      }

      await actionTreeItem({
        action: "DISABLE",
        nodes,
        tree,
        pollCriteria: (response) => response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "DISABLED",
        parameter: { name: "PURGETYPE", value: disableType.replace(" ", "").toUpperCase() }
      });
    }),
  ];
};