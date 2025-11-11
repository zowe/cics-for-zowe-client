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
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, ProgramMeta.humanReadableNameSingular));
      return;
    }
    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableTransaction = async (treeNode: CICSResourceContainerNode<ITransaction>) => {
    const nodes = findSelectedNodes(treeview, TransactionMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, TransactionMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableLibrary = async (treeNode: CICSResourceContainerNode<ILibrary>) => {
    const nodes = findSelectedNodes(treeview, LibraryMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, LibraryMeta.humanReadableNameSingular));
      return;
    }

    await actionTreeItem({ action: "DISABLE", nodes, tree });
  };

  const disableBundle = async (treeNode: CICSResourceContainerNode<IBundle>) => {
    const nodes = findSelectedNodes(treeview, BundleMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, BundleMeta.humanReadableNamePlural));
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
      window.showErrorMessage(l10n.t(`No CICS {0} selected`, LocalFileMeta.humanReadableNameSingular));
      return;
    }

    const busyChoices: Record<string, string> = {
      [l10n.t("Wait")]: "WAIT",
      [l10n.t("No Wait")]: "NOWAIT",
      [l10n.t("Force")]: "FORCE",
    };

    const picked = await window.showInformationMessage(
      l10n.t("Choose one of the following for the file busy condition"),
      ...Object.keys(busyChoices)
    );
    if (!picked) {
      return;
    }

    const busyDecision = busyChoices[picked] ?? "WAIT";

    await actionTreeItem({
      action: "DISABLE",
      nodes,
      tree,
      parameter: { name: "BUSY", value: busyDecision },
    });
  };

  const disableJVMEndpoint = async (treeNode: CICSResourceContainerNode<IJVMEndpoint>) => {
    const nodes = findSelectedNodes(treeview, JVMEndpointMeta, treeNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, JVMEndpointMeta.humanReadableNameSingular));
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
      await window.showErrorMessage(l10n.t(`No CICS {0} selected`, JVMServerMeta.humanReadableNameSingular));
      return;
    }

    const purgeChoices: Record<string, string> = {
      [l10n.t("Phase Out")]: "PHASEOUT",
      [l10n.t("Purge")]: "PURGE",
      [l10n.t("Force Purge")]: "FORCEPURGE",
      [l10n.t("Kill")]: "KILL",
    };

    const picked = await window.showInformationMessage(
      l10n.t("Choose how to purge tasks while disabling the JVM server"),
      ...Object.keys(purgeChoices)
    );
    if (!picked) {
      return;
    }

    const disableType = purgeChoices[picked] ?? "PHASEOUT";

    await actionTreeItem({
      action: "DISABLE",
      nodes,
      tree,
      pollCriteria: (response) => response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "DISABLED",
      parameter: { name: "PURGETYPE", value: disableType },
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
