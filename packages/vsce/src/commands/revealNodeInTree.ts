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
import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { Gui } from "@zowe/zowe-explorer-api";
import { QuickPickItem, TreeView, commands, l10n, window } from "vscode";
import { getMetas, IResourceMeta } from "../doc";
import { CICSPlexTree, CICSRegionTree, CICSResourceContainerNode, CICSSessionTree } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { CICSLogger } from "../utils/CICSLogger";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
/**
 * Interface for the reveal node parameters
 */
export interface IRevealNodeParams {
  profileName?: string;
  plexName?: string;
  regionName?: string;
  resourceType?: string;
  resourceName?: string;
}
/**
 * Prompts user to select a CICS profile from loaded profiles
 */
async function promptForProfile(tree: CICSTree, params: IRevealNodeParams): Promise<CICSSessionTree | undefined> {
  if (params.profileName) {
    const sessionNode = tree.getLoadedProfiles().find((session) => session.getProfile().name === params.profileName);
    if (!sessionNode) {
      window.showErrorMessage(l10n.t("Profile '{0}' not found in the tree.", params.profileName));
      return undefined;
    }
    return sessionNode;
  }
  const loadedProfiles = tree.getLoadedProfiles();
  if (loadedProfiles.length === 0) {
    window.showErrorMessage(l10n.t("No CICS profiles loaded. Please add a profile first."));
    return undefined;
  }
  const profileItems: QuickPickItem[] = loadedProfiles.map((profile) => ({
    label: profile.getProfile().name,
    description: profile.getProfile().profile?.host || "",
  }));
  const selectedProfile = await Gui.showQuickPick(profileItems, {
    placeHolder: l10n.t("Select a CICS profile"),
    ignoreFocusOut: true,
  });
  if (!selectedProfile) {
    return undefined;
  }
  params.profileName = selectedProfile.label;
  const sessionNode = loadedProfiles.find((session) => session.getProfile().name === params.profileName);
  
  CICSLogger.info(`Selected profile: ${params.profileName}`);
  return sessionNode;
}
/**
 * Expands the session node to load its children
 */
async function expandSessionNode(sessionNode: CICSSessionTree, treeview: TreeView<any>): Promise<void> {
  if (!sessionNode.children || sessionNode.children.length === 0) {
    await treeview.reveal(sessionNode, { expand: true, select: false });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
/**
 * Prompts user to select a plex (or skip for direct regions)
 */
async function promptForPlex(
  sessionNode: CICSSessionTree,
  params: IRevealNodeParams
): Promise<CICSPlexTree | undefined> {
  const plexes = sessionNode.children.filter((child) => child instanceof CICSPlexTree) as CICSPlexTree[];
  if (params.plexName) {
    return plexes.find((plex) => plex.getPlexName() === params.plexName);
  }
  if (plexes.length === 0) {
    return undefined;
  }
  const plexItems: QuickPickItem[] = plexes.map((plex) => ({
    label: plex.getPlexName(),
    description: plex.getGroupName() ? `Group: ${plex.getGroupName()}` : "",
  }));
  plexItems.unshift({
    label: l10n.t("(No Plex - Direct Region)"),
    description: l10n.t("Select a region directly under the profile"),
  });
  const selectedPlex = await Gui.showQuickPick(plexItems, {
    placeHolder: l10n.t("Select a CICS Plex or choose direct region"),
    ignoreFocusOut: true,
  });
  if (!selectedPlex) {
    return undefined; 
  }
  if (selectedPlex.label === l10n.t("(No Plex - Direct Region)")) {
    return undefined; 
  }
  params.plexName = selectedPlex.label;
  const plexNode = plexes.find((plex) => plex.getPlexName() === params.plexName);
  
  CICSLogger.info(`Selected plex: ${params.plexName}`);
  return plexNode;
}

async function getAvailableRegions(
  sessionNode: CICSSessionTree,
  plexNode: CICSPlexTree | undefined,
  treeview: TreeView<any>
): Promise<CICSRegionTree[]> {
  let availableRegions: CICSRegionTree[] = [];
  if (plexNode) {
    await treeview.reveal(plexNode, { expand: true, select: false });
    const regionsContainer = plexNode.children.find(
      (child) => child instanceof CICSRegionsContainer
    ) as CICSRegionsContainer;
    if (regionsContainer) {
      await treeview.reveal(regionsContainer, { expand: true, select: false });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      availableRegions = regionsContainer.children || [];
    }
  } else {
    availableRegions = sessionNode.children.filter(
      (child) => child instanceof CICSRegionTree
    ) as CICSRegionTree[];
  }
  return availableRegions;
}
/**
 * Prompts user to select a region
 */
async function promptForRegion(
  sessionNode: CICSSessionTree,
  plexNode: CICSPlexTree | undefined,
  params: IRevealNodeParams,
  treeview: TreeView<any>
): Promise<CICSRegionTree | undefined> {
  if (params.regionName) {
    // Find region by name
    if (plexNode) {
      return plexNode.getRegionNodeFromName(params.regionName);
    } else {
      return sessionNode.getRegionNodeFromName(params.regionName);
    }
  }
  const availableRegions = await getAvailableRegions(sessionNode, plexNode, treeview);
  if (availableRegions.length === 0) {
    window.showErrorMessage(l10n.t("No regions found"));
    return undefined;
  }
  const regionItems: QuickPickItem[] = availableRegions.map((region) => ({
    label: region.getRegionName(),
    description: region.getIsActive() ? l10n.t("Active") : l10n.t("Inactive"),
  }));
  const selectedRegion = await Gui.showQuickPick(regionItems, {
    placeHolder: l10n.t("Select a CICS region"),
    ignoreFocusOut: true,
  });
  if (!selectedRegion) {
    return undefined;
  }
  params.regionName = selectedRegion.label;
  const regionNode = availableRegions.find((region) => region.getRegionName() === params.regionName);
  
  CICSLogger.info(`Selected region: ${params.regionName}`);
  return regionNode;
}

async function expandAndValidateRegion(
  regionNode: CICSRegionTree,
  treeview: TreeView<any>
): Promise<boolean> {
  if (!regionNode.getIsActive()) {
    window.showErrorMessage(l10n.t("Region '{0}' is not active", regionNode.getRegionName()));
    return false;
  }
  await treeview.reveal(regionNode, { expand: true, select: false });
  return true;
}

async function promptForResourceType(
  regionNode: CICSRegionTree,
  params: IRevealNodeParams
): Promise<IResourceMeta<IResource> | undefined> {
  const allMetas = getMetas();
  if (params.resourceType) {
    return allMetas.find((meta) => meta.resourceName === params.resourceType);
  }
  const availableContainers = (regionNode.children || []).filter(
    (child) => child instanceof CICSResourceContainerNode
  ) as CICSResourceContainerNode<IResource>[];
  if (availableContainers.length === 0) {
    window.showErrorMessage(l10n.t("No resource types available in this region"));
    return undefined;
  }
  const resourceTypeItems: QuickPickItem[] = availableContainers.map((container) => ({
    label: container.label.toString(),
    description: container.resourceTypes?.[0]?.resourceName || "",
  }));
  const selectedResourceType = await Gui.showQuickPick(resourceTypeItems, {
    placeHolder: l10n.t("Select a resource type"),
    ignoreFocusOut: true,
  });
  if (!selectedResourceType) {
    return undefined; 
  }
  const selectedContainer = availableContainers.find(
    (container) => container.label.toString() === selectedResourceType.label
  );
  if (selectedContainer && selectedContainer.resourceTypes && selectedContainer.resourceTypes.length > 0) {
    const resourceMeta = selectedContainer.resourceTypes[0];
    params.resourceType = resourceMeta.resourceName;
    CICSLogger.info(`Selected resource type: ${params.resourceType}`);
    return resourceMeta;
  }
  return undefined;
}
async function promptForResourceName(
  resourceMeta: IResourceMeta<IResource>,
  params: IRevealNodeParams
): Promise<string | undefined> {
  if (params.resourceName) {
    return params.resourceName;
  }
  const resourceNameInput = await window.showInputBox({
    prompt: l10n.t("Enter the {0} name to reveal", resourceMeta.humanReadableNameSingular),
    placeHolder: l10n.t("Resource name (e.g., MYPROG01)"),
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value || value.trim().length === 0) {
        return l10n.t("Resource name cannot be empty");
      }
      return null;
    },
  });
  if (!resourceNameInput) {
    return undefined; 
  }
  const resourceName = resourceNameInput.trim().toUpperCase();
  params.resourceName = resourceName;
  CICSLogger.info(`Searching for resource: ${resourceName}`);
  return resourceName;
}

async function revealResourceInTree(
  regionNode: CICSRegionTree,
  resourceMeta: IResourceMeta<IResource>,
  resourceName: string,
  tree: CICSTree,
  treeview: TreeView<any>
): Promise<void> {
  const resourceContainerNode = regionNode.getContainerNodeForResourceType(resourceMeta);
  if (!resourceContainerNode) {
    window.showErrorMessage(
      l10n.t(
        "Resource type '{0}' not found in region '{1}'. It may be disabled in settings.",
        resourceMeta.humanReadableNamePlural,
        regionNode.getRegionName()
      )
    );
    return;
  }
  resourceContainerNode.setCriteria([resourceName]);
  resourceContainerNode.description = resourceName;
  tree.refresh(resourceContainerNode);
    
  await treeview.reveal(resourceContainerNode, { expand: true, select: false });
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  const children = await resourceContainerNode.getChildren();
  if (children && children.length > 0) {
    const resourceNode = children.find(
      (child) =>
        child instanceof CICSResourceContainerNode &&
        child.getContainedResource() &&
        resourceMeta.getName(child.getContainedResource().resource) === resourceName
    ) as CICSResourceContainerNode<IResource>;
    if (resourceNode) {
      await treeview.reveal(resourceNode, { expand: false, select: true, focus: true });
      CICSLogger.info(`Successfully revealed resource: ${resourceName}`);
      window.showInformationMessage(l10n.t("Resource '{0}' revealed in the tree", resourceName));
    } else {
      window.showWarningMessage(
        l10n.t("Resource '{0}' not found in region '{1}'", resourceName, regionNode.getRegionName())
      );
    }
  } else {
    window.showWarningMessage(
      l10n.t("No resources found matching '{0}' in region '{1}'", resourceName, regionNode.getRegionName())
    );
  }
}
/**
 * Command to reveal and expand a specific resource node in the CICS tree
 *
 * This command navigates through the tree hierarchy:
 * Profile -> Plex (optional) -> Region -> Resource Type -> Resource
 *
 * Prompts the user for each parameter if not provided.
 *
 * @param tree - The CICS tree data provider
 * @param treeview - The tree view instance
 * @returns The registered command
 */
export function getRevealNodeInTreeCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.revealNodeInTree", async (params?: IRevealNodeParams) => {
    try {
      if (!params) {
        params = {};
      }
      const sessionNode = await promptForProfile(tree, params);
      if (!sessionNode) return;
      await expandSessionNode(sessionNode, treeview);
      const plexNode = await promptForPlex(sessionNode, params);
      if (params.plexName && !plexNode) {
        window.showErrorMessage(l10n.t("Plex '{0}' not found", params.plexName));
        return;
      }
      const regionNode = await promptForRegion(sessionNode, plexNode, params, treeview);
      if (!regionNode) {
        if (params.regionName) {
          window.showErrorMessage(l10n.t("Region '{0}' not found", params.regionName));
        }
        return;
      }
      const isRegionValid = await expandAndValidateRegion(regionNode, treeview);
      if (!isRegionValid) return;
      const resourceMeta = await promptForResourceType(regionNode, params);
      if (!resourceMeta) {
        if (params.resourceType) {
          window.showErrorMessage(l10n.t("Resource type '{0}' is not supported", params.resourceType));
        }
        return;
      }
      const resourceName = await promptForResourceName(resourceMeta, params);
      if (!resourceName) return;
      await revealResourceInTree(regionNode, resourceMeta, resourceName, tree, treeview);
    } catch (error) {
      CICSLogger.error(`Error revealing node in tree: ${error}`);
      window.showErrorMessage(l10n.t("Failed to reveal node in tree: {0}", error.message || JSON.stringify(error)));
    }
  });
}
