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

import { ExtensionContext, window } from "vscode";
import { CICSTree } from "./trees/CICSTree";
import { getFolderIcon } from "./utils/iconUtils";
import { ProfileManagement } from "./utils/profileManagement";
import { getZoweExplorerVersion } from "./utils/workspaceUtils";

import { IExtensionAPI } from "@zowe/cics-for-zowe-explorer-api";
import { getCommands } from "./commands";
import { CICSMessages } from "./constants/CICS.messages";
import CICSExtenderApiConfig from "./extending/CICSExtenderApiConfig";
import { ResourceInspectorViewProvider } from "./trees/ResourceInspectorViewProvider";
import { CICSLogger } from "./utils/CICSLogger";
import PersistentStorage from "./utils/PersistentStorage";

/**
 * Initializes the extension
 * @param context
 * @returns
 */
export async function activate(context: ExtensionContext): Promise<IExtensionAPI> {
  const zeVersion = getZoweExplorerVersion();

  let treeDataProv: CICSTree = null;
  if (!zeVersion) {
    CICSLogger.error(CICSMessages.zoweExplorerNotFound.message);
    window.showErrorMessage(CICSMessages.zoweExplorerNotFound.message);
    return;
  } else if (zeVersion[0] !== "3") {
    const message = `Current version of Zowe Explorer is ${zeVersion}. Please ensure Zowe Explorer v3.0.0 or higher is installed`;
    CICSLogger.error(message);
    window.showErrorMessage(message);
    return;
  }
  if (ProfileManagement.apiDoesExist()) {
    try {
      // Register 'cics' profiles as a ZE extender
      await ProfileManagement.registerCICSProfiles();
      ProfileManagement.getProfilesCache().registerCustomProfilesType("cics");
      const apiRegister = await ProfileManagement.getExplorerApis();
      await apiRegister.getExplorerExtenderApi().reloadProfiles();
      if (apiRegister.onProfilesUpdate) {
        apiRegister.onProfilesUpdate(async () => {
          await treeDataProv.refreshLoadedProfiles();
        });
      }
      CICSLogger.debug(CICSMessages.zoweExplorerModified.message);
    } catch (error) {
      CICSLogger.error(CICSMessages.notInitializedCorrectly.message);
      return;
    }
  } else {
    CICSLogger.error(CICSMessages.incorrectZoweExplorerVersion.message);
    window.showErrorMessage(CICSMessages.incorrectZoweExplorerVersion.message);
    return;
  }

  PersistentStorage.setContext(context);

  treeDataProv = new CICSTree();
  const treeview = window.createTreeView("cics-view", {
    treeDataProvider: treeDataProv,
    showCollapseAll: true,
    canSelectMany: true,
  });

  treeDataProv.hookCollapseWatcher(treeview);

  treeview.onDidExpandElement((node) => {
    if (node.element.refreshIcon) {
      node.element.refreshIcon(true);
    }
    treeDataProv._onDidChangeTreeData.fire(node.element);
  });

  treeview.onDidCollapseElement((node) => {
    const interestedContextValues = ["cicsregionscontainer."];

    if (interestedContextValues.some((item) => node.element.contextValue.includes(item))) {
      node.element.iconPath = getFolderIcon(false);
    }
    node.element.refreshIcon();
    treeDataProv._onDidChangeTreeData.fire(node.element);
  });

  context.subscriptions.push(...getCommands(treeDataProv, treeview, context));
  context.subscriptions.push(
    window.registerWebviewViewProvider(ResourceInspectorViewProvider.viewType, ResourceInspectorViewProvider.getInstance(context, treeDataProv))
  );

  return CICSExtenderApiConfig.getAPI();
}

export async function deactivate(): Promise<void> {
  await CICSLogger.dispose();
}
