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

import { ProgressLocation, l10n, window } from "vscode";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSSessionTree } from "../trees/CICSSessionTree";
import { CICSTree } from "../trees/CICSTree";
import { getFolderIcon } from "./iconUtils";
import { ProfileManagement } from "./profileManagement";

export async function sessionExpansionHandler(session: CICSSessionTree, tree: CICSTree) {
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(session.label?.toString()!);
  if (profile == null) {
    throw new Error(l10n.t("sessionExpansionHandler: Profile is not defined"));
  }
  await tree.loadProfile(profile, session);
}

export async function regionContainerExpansionHandler(regionContiner: CICSRegionsContainer, tree: CICSTree) {
  const parentPlex = regionContiner.getParent();
  const plexProfile = parentPlex.getProfile();
  if (plexProfile.profile.regionName && plexProfile.profile.cicsPlex) {
    if (parentPlex.getGroupName()) {
      // CICSGroup
      await window.withProgress(
        {
          title: l10n.t("Loading regions"),
          location: ProgressLocation.Notification,
          cancellable: false,
        },
        async (_, token) => {
          token.onCancellationRequested(() => {});
          regionContiner.clearChildren();
          await regionContiner.loadRegionsInCICSGroup(tree);
          regionContiner.iconPath = getFolderIcon(true);
          tree._onDidChangeTreeData.fire(undefined);
        }
      );
    }
  } else {
    await window.withProgress(
      {
        title: l10n.t("Loading regions"),
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (_, token) => {
        token.onCancellationRequested(() => {});
        regionContiner.clearChildren();
        await regionContiner.loadRegionsInPlex();
        regionContiner.iconPath = getFolderIcon(true);
        if (!regionContiner.getChildren().length) {
          l10n.t("No regions found for plex {0}", "No regions found for plex {0}", parentPlex.getPlexName());
        }
        tree._onDidChangeTreeData.fire(undefined);
      }
    );
  }
  tree._onDidChangeTreeData.fire(undefined);
}

export async function plexExpansionHandler(plex: CICSPlexTree, tree: CICSTree) {
  const plexProfile = plex.getProfile();
  // Region name and plex name specified
  if (plexProfile.profile.regionName && plexProfile.profile.cicsPlex) {
    // If connection doesn't have a group name
    if (!plex.getGroupName()) {
      // Only 1 CICSRegion inside CICSPlex
      window.withProgress(
        {
          title: l10n.t("Loading region"),
          location: ProgressLocation.Notification,
          cancellable: false,
        },
        async (_, token) => {
          token.onCancellationRequested(() => {});
          await plex.loadOnlyRegion();
          tree._onDidChangeTreeData.fire(undefined);
        }
      );
      // CICSGroup
    } else {
      plex.clearChildren();
      const regionsContainer = plex.addRegionContainer();
      await regionContainerExpansionHandler(regionsContainer, tree);
      if (regionsContainer.children.length) {
        plex.addNewCombinedTrees();
      }
      tree._onDidChangeTreeData.fire(undefined);
    }
  } else {
    plex.clearChildren();
    const regionsContainer = plex.addRegionContainer();
    await regionContainerExpansionHandler(regionsContainer, tree);
    if (regionsContainer.children.length) {
      plex.addNewCombinedTrees();
    }
    tree._onDidChangeTreeData.fire(undefined);
  }
  tree._onDidChangeTreeData.fire(undefined);
}
