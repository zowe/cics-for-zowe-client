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
import { TreeView, commands, l10n, window } from "vscode";
import { BundleMeta, JVMEndpointMeta, JVMServerMeta, LibraryMeta, LocalFileMeta, ProgramMeta, TransactionMeta } from "../doc";
import { CICSResourceContainerNode, CICSTree } from "../trees";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

export const getDisableResourceCommands = (tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) => {
  const disableProgram = async (treeNode: CICSResourceContainerNode<IProgram>) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t("No CICS program selected"));
      return;
    }
    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableTransaction = async (treeNode: CICSResourceContainerNode<ITransaction>) => {
    const nodes = findSelectedNodes(treeview, TransactionMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t("No CICS Transaction selected"));
      return;
    }

    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableLibrary = async (treeNode: CICSResourceContainerNode<ILibrary>) => {
    const nodes = findSelectedNodes(treeview, LibraryMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t("No CICS Library selected"));
      return;
    }

    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableBundle = async (treeNode: CICSResourceContainerNode<IBundle>) => {
    const nodes = findSelectedNodes(treeview, BundleMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t("No CICS Bundles selected"));
      return;
    }

    await actionTreeItem({
      action: "DISABLE",
      nodes,
      tree,
      pollCriteria: (response) => response.records?.cicsbundle?.enablestatus.toUpperCase() === "DISABLED",
    });
  };

  const disableLocalFile = async (treeNode: CICSResourceContainerNode<ILocalFile>) => {
    const nodes = findSelectedNodes(treeview, LocalFileMeta, treeNode);
    if (!nodes || !nodes.length) {
      window.showErrorMessage(l10n.t("No CICS local file selected"));
      return;
    }

    const BUSY_CHOICES = [
      { id: "WAIT", label: l10n.t("Wait") },
      { id: "NOWAIT", label: l10n.t("No Wait") },
      { id: "FORCE", label: l10n.t("Force") },
    ];

    const picked = await window.showInformationMessage(
      l10n.t("Choose one of the following for the file busy condition"),
      ...BUSY_CHOICES.map((c) => c.label)
    );
    if (!picked) {
      return;
    }

    const busyDecision = BUSY_CHOICES.find((c) => c.label === picked)?.id ?? "WAIT";

    await actionTreeItem({
      action: "DISABLE",
      nodes,
      tree,
      parameter: { name: "BUSY", value: busyDecision.replace(" ", "").toUpperCase() },
    });
  };

  const disableJVMEndpoint = async (treeNode: CICSResourceContainerNode<IJVMEndpoint>) => {
    const nodes = findSelectedNodes(treeview, JVMEndpointMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t("No CICS JVM endpoint selected"));
      return;
    }

    await actionTreeItem({
      action: "DISABLE",
      nodes,
      tree,
      getParentResource: (node: CICSResourceContainerNode<IJVMServer>) => node.getContainedResource().resource.attributes,
      pollCriteria: (response) => response.records?.cicsjvmendpoint?.enablestatus.toUpperCase() === "DISABLED",
    });
  };

  const disableJVMServer = async (treeNode: CICSResourceContainerNode<IJVMServer>) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t("No CICS JVM server selected"));
      return;
    }

    const PURGE_CHOICES = [
      { id: "PHASEOUT", label: l10n.t("Phase Out") },
      { id: "PURGE", label: l10n.t("Purge") },
      { id: "FORCEPURGE", label: l10n.t("Force Purge") },
      { id: "KILL", label: l10n.t("Kill") },
    ];

    const picked = await window.showInformationMessage(
      l10n.t("Choose how to purge tasks while disabling the JVM server"),
      ...PURGE_CHOICES.map((c) => c.label)
    );
    if (!picked) {
      return;
    }

    const disableType = PURGE_CHOICES.find((c) => c.label === picked)?.id ?? "PURGE";

    await actionTreeItem({
      action: "DISABLE",
      nodes,
      tree,
      pollCriteria: (response) => response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "DISABLED",
      parameter: { name: "PURGETYPE", value: disableType.replace(" ", "").toUpperCase() },
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
