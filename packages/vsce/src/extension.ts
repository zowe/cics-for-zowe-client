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
import { CICSSessionTree } from "./trees/CICSSessionTree";
import { CICSTree } from "./trees/CICSTree";
import { plexExpansionHandler, regionContainerExpansionHandler, sessionExpansionHandler } from "./utils/expansionHandler";
import { ProfileManagement } from "./utils/profileManagement";
import { getIconOpen, getIconPathInResources } from "./utils/profileUtils";
import { getZoweExplorerVersion } from "./utils/workspaceUtils";

import { Logger } from "@zowe/imperative";
import { getCommands } from "./commands";

/**
 * Initializes the extension
 * @param context
 * @returns
 */
export async function activate(context: ExtensionContext) {
  const zeVersion = getZoweExplorerVersion();
  const logger = Logger.getAppLogger();
  let treeDataProv: CICSTree = null;
  if (!zeVersion) {
    window.showErrorMessage("Zowe Explorer was not found: Please ensure Zowe Explorer v2.0.0 or higher is installed");
    return;
  } else if (zeVersion[0] !== "3") {
    window.showErrorMessage(`Current version of Zowe Explorer is ${zeVersion}. Please ensure Zowe Explorer v3.0.0 or higher is installed`);
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
      logger.debug("Zowe Explorer was modified for the CICS Extension.");
    } catch (error) {
      logger.error("IBM CICS for Zowe Explorer was not initialized correctly");
      return;
    }
  } else {
    window.showErrorMessage(
      "Zowe Explorer was not found: either it is not installed or you are using an older version without extensibility API. " +
      "Please ensure Zowe Explorer v2.0.0-next.202202221200 or higher is installed"
    );
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
    window.withProgress({
      location: ProgressLocation.Notification,
      title: "Loading resources...",
      cancellable: true
    }, async (_progress, _token) => {
      await node.element.loadContents();
      node.element.collapsibleState = TreeItemCollapsibleState.Expanded;
      treeDataProv._onDidChangeTreeData.fire(undefined);
    });
  };

  const contextMap: { [key: string]: (node: any) => Promise<void> | void; } = {
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
        const newSessionTree = new CICSSessionTree(
          node.element.getParent().profile,
          getIconPathInResources("profile-disconnected-dark.svg", "profile-disconnected-light.svg")
        );
        treeDataProv.loadedProfiles.splice(treeDataProv.getLoadedProfiles().indexOf(node.element.getParent()), 1, newSessionTree);
        treeDataProv._onDidChangeTreeData.fire(undefined);
      }
    },

    cicsregionscontainer: (node: any) => {
      node.element.iconPath = getIconOpen(true);
      regionContainerExpansionHandler(node.element, treeDataProv);
      treeDataProv._onDidChangeTreeData.fire(undefined);
    }
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
      "cicslibrary.",
      "cicstreeweb.",
      "cicstreetcpips.",
      "cicstreepipeline.",
      "cicstreewebservice.",
      "cicstreeurimaps.",
    ];

    if (interestedContextValues.some(item => node.element.contextValue.includes(item))) {
      node.element.iconPath = getIconOpen(false);
    }
    node.element.collapsibleState = TreeItemCollapsibleState.Collapsed;
    treeDataProv._onDidChangeTreeData.fire(undefined);
  });

  context.subscriptions.concat(getCommands(treeDataProv, treeview));
}
