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

import { ExtensionContext, TreeView, Uri, commands, window } from "vscode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSLocalFileTreeItem } from "../trees/treeItems/CICSLocalFileTreeItem";
import { CICSProgramTreeItem } from "../trees/treeItems/CICSProgramTreeItem";
import { findSelectedNodes } from "../utils/commandUtils";

let resourceViewProvider: ResourceInspectorViewProvider;
//const locFileAttributes = ["VSAMTYPE", "RECORDSIZE", "KEYLENGTH", "DSNAME"];

export function getResourceInspectorforProgramFile(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.programResourceInspectorView", async (node) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSProgramTreeItem, node);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS program selected");
      return;
    }
    getResourceViewProvider(allSelectedNodes, "CICSProgram", context.extensionUri, treeview);
  });
}

export function getResourceInspectorforLocalFile(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.localFileResourceInspectorView", async (node) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSLocalFileTreeItem, node);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS program selected");
      return;
    }
    getResourceViewProvider(allSelectedNodes, "CICSLocalFile", context.extensionUri, treeview);
  });
}

function getResourceViewProvider(allSelectedNodes: any[], resourceValue: string, extensionUri: Uri, treeview: TreeView<any>) {
  let data;
  let details;
  for (const item of allSelectedNodes) {
    if (resourceValue === "CICSProgram") {
      data = {
        label: item.label,
        attributes: item.program,
        resource: resourceValue,
        details: {
          status: "(Program File; " + item.program.status + ")",
          type: item.program.progtype,
          permission: item.program.sharestatus,
          keyLength: item.program.length,
          recordSize: item.program.changeagrel,
          dsName: item.program.eyu_cicsname,
        },
      };
    }
    if (resourceValue === "CICSLocalFile") {
      data = {
        label: item.label,
        attributes: item.localFile,
        resource: resourceValue,
        details: {
          status: "(Local File; " + (item.localFile.openstatus + " and " + item.localFile.enablestatus).toLowerCase() + ")",
          Type: item.localFile.vsamtype,
          Permission: item.localFile.read + " , " + item.localFile.browse,
          Keylength: item.localFile.keylength,
          "Record Size": item.localFile.recordsize,
          "DS Name": item.localFile.dsname,
        },
      };
    }

    resourceViewProvider = ResourceInspectorViewProvider.getInstance(extensionUri, treeview);
    const enbededWebview = resourceViewProvider?._manager?._view;
    resourceViewProvider.reloadData(data, enbededWebview);
  }
  commands.executeCommand("setContext", "zowe.vscode-extension-for-zowe.showResourceInspector", true);
  commands.executeCommand("workbench.view.extension.inspector-panel");
}
