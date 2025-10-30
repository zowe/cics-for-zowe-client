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

import { IBundle, IJVMEndpoint, IJVMServer, ILibrary, ILocalFile, IProgram, IResource, ITransaction } from "@zowe/cics-for-zowe-explorer-api";
import { commands, TreeView, window } from "vscode";
import { BundleMeta, JVMEndpointMeta, JVMServerMeta, LibraryMeta, LocalFileMeta, ProgramMeta, TransactionMeta } from "../doc";
import { CICSResourceContainerNode, CICSTree } from "../trees";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

export const getDisableResourceCommands = (tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) => {

  const disableProgram = async (treeNode: CICSResourceContainerNode<IProgram>) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS program selected");
      return;
    }
    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableTransaction = async (treeNode: CICSResourceContainerNode<ITransaction>) => {
    const nodes = findSelectedNodes(treeview, TransactionMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS Transaction selected");
      return;
    }

    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableLibrary = async (treeNode: CICSResourceContainerNode<ILibrary>) => {
    const nodes = findSelectedNodes(treeview, LibraryMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS Library selected");
      return;
    }

    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableBundle = async (treeNode: CICSResourceContainerNode<IBundle>) => {
    const nodes = findSelectedNodes(treeview, BundleMeta, treeNode);
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
  };

  const disableLocalFile = async (treeNode: CICSResourceContainerNode<ILocalFile>) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, treeNode);
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
  };

  const disableJVMEndpoint = async (treeNode: CICSResourceContainerNode<IJVMEndpoint>) => {
    const nodes = findSelectedNodes(treeview, JVMEndpointMeta, treeNode);
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
  };

  const disableJVMServer = async (treeNode: CICSResourceContainerNode<IJVMServer>) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, treeNode);
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
  };

  return [
    commands.registerCommand("cics-extension-for-zowe.disableProgram", disableProgram),
    commands.registerCommand("cics-extension-for-zowe.disableTransaction", disableTransaction),
    commands.registerCommand("cics-extension-for-zowe.disableLibrary", disableLibrary),
    commands.registerCommand("cics-extension-for-zowe.disableBundle", disableBundle),
    commands.registerCommand("cics-extension-for-zowe.disableLocalFile", disableLocalFile),
    commands.registerCommand("cics-extension-for-zowe.disableJVMEndpoint", disableJVMEndpoint),
    commands.registerCommand("cics-extension-for-zowe.disableJVMServer", disableJVMServer),
  ];
};