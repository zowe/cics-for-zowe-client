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

import { ExtensionContext, ProgressLocation, TreeItemCollapsibleState, window } from "vscode";
import { CICSTree } from "./trees/CICSTree";
import { plexExpansionHandler, regionContainerExpansionHandler, sessionExpansionHandler } from "./utils/expansionHandler";
import { getFolderIcon, getIconFilePathFromName } from "./utils/iconUtils";
import { ProfileManagement } from "./utils/profileManagement";
import { getZoweExplorerVersion } from "./utils/workspaceUtils";

import { getCommands } from "./commands";
import { CicsLogger } from "./utils/cicsLogger";
import { LoggerUtils } from "./utils/LoggerUtils";
import { CicsMessages } from "./constants/Cics.messages";

/**
 * Initializes the extension
 * @param context
 * @returns
 */
export async function activate(context: ExtensionContext) {
  const zeVersion = getZoweExplorerVersion();

  const logsPath =
  await CicsLogger.initializeZoweLogger(context);
  CicsLogger.zeOutputChannel = await LoggerUtils.initVscLogger(context, logsPath);


  let treeDataProv: CICSTree = null;
  if (!zeVersion) {
    CicsLogger.error(CicsMessages.zoweExplorerNotFound.message);
    window.showErrorMessage(CicsMessages.zoweExplorerNotFound.message);
    return;
  } else if (zeVersion[0] !== "3") {
    const message = `Current version of Zowe Explorer is ${zeVersion}. Please ensure Zowe Explorer v3.0.0 or higher is installed`;
    CicsLogger.error(message);
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
      CicsLogger.debug(CicsMessages.zoweExplorerModified.message);
    } catch (error) {
      CicsLogger.error(CicsMessages.notInitializedCorrectly.message);
      return;
    }
  } else {
    CicsLogger.error(CicsMessages.incorrectZoweExplorerVersion.message);
    window.showErrorMessage(CicsMessages.incorrectZoweExplorerVersion.message);
    return;
  }

  treeDataProv = new CICSTree();
  const treeview = window.createTreeView("cics-view", {
    treeDataProvider: treeDataProv,
    showCollapseAll: true,
    canSelectMany: true,
  });

  const expandCombinedTree = async (node: any) => {
    if (node.element.getActiveFilter()) {
      await node.element.loadContents(treeDataProv);
    }
    node.element.collapsibleState = TreeItemCollapsibleState.Expanded;
  };

  const expandResourceTree = (node: any) => {
    window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: CicsMessages.loadingResources.message,
        cancellable: true,
      },
      async (_progress, _token) => {
        await node.element.loadContents();
        node.element.collapsibleState = TreeItemCollapsibleState.Expanded;
        treeDataProv._onDidChangeTreeData.fire(undefined);
      }
    );
  };

  const contextMap: { [key: string]: (node: any) => Promise<void> | void } = {
    cicscombinedprogramtree: expandCombinedTree,
    cicscombinedtransactiontree: expandCombinedTree,
    cicscombinedlocalfiletree: expandCombinedTree,
    cicscombinedtasktree: expandCombinedTree,
    cicscombinedlibrarytree: expandCombinedTree,
    cicscombinedtcpipstree: expandCombinedTree,
    cicscombinedurimapstree: expandCombinedTree,
    cicscombinedpipelinetree: expandCombinedTree,
    cicscombinedwebservicetree: expandCombinedTree,

    cicstreeweb: expandResourceTree,
    cicstreeprogram: expandResourceTree,
    cicstreetransaction: expandResourceTree,
    cicstreelocalfile: expandResourceTree,
    cicstreetask: expandResourceTree,
    cicstreelibrary: expandResourceTree,
    cicslibrary: expandResourceTree,
    cicsdatasets: expandResourceTree,
    cicstreetcpips: expandResourceTree,
    cicstreewebservice: expandResourceTree,
    cicstreepipeline: expandResourceTree,
    cicstreeurimaps: expandResourceTree,

    cicssession: async (node: any) => {
      await sessionExpansionHandler(node.element, treeDataProv);
    },

    cicsplex: (node: any) => {
      try {
        plexExpansionHandler(node.element, treeDataProv);
      } catch (error) {
        CicsLogger.error(error);
        node.element.getParent().iconPath = getIconFilePathFromName("profile-disconnected");
        treeDataProv._onDidChangeTreeData.fire(undefined);
      }
    },

    cicsregionscontainer: (node: any) => {
      node.element.iconPath = getFolderIcon(true);
      regionContainerExpansionHandler(node.element, treeDataProv);
      treeDataProv._onDidChangeTreeData.fire(undefined);
    },
  };

  treeview.onDidExpandElement((node) => {
    const contextValue = node.element.contextValue;
    const initialContext = contextValue.split(".")[0];

    if (initialContext in contextMap) {
      contextMap[initialContext](node);
    }
  });

  treeview.onDidCollapseElement((node) => {
    const interestedContextValues = [
      "cicsregionscontainer.",
      "cicscombinedprogramtree.",
      "cicscombinedtransactiontree.",
      "cicscombinedlocalfiletree.",
      "cicscombinedtasktree.",
      "cicscombinedlibrarytree.",
      "cicscombinedtcpipstree.",
      "cicscombinedurimapstree.",
      "cicscombinedpipelinetree.",
      "cicscombinedwebservicetree.",
      "cicstreeprogram.",
      "cicstreetransaction.",
      "cicstreelocalfile.",
      "cicstreetask.",
      "cicstreelibrary.",
      "cicstreeweb.",
      "cicstreetcpips.",
      "cicstreepipeline.",
      "cicstreewebservice.",
      "cicstreeurimaps.",
    ];

    if (interestedContextValues.some((item) => node.element.contextValue.includes(item))) {
      node.element.iconPath = getFolderIcon(false);
    }
    node.element.collapsibleState = TreeItemCollapsibleState.Collapsed;
    treeDataProv._onDidChangeTreeData.fire(undefined);
  });

  context.subscriptions.concat(getCommands(treeDataProv, treeview));
}

export async function deactivate(): Promise<void> {
  CicsLogger.disposeZoweLogger();
}
