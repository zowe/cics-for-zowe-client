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

import { type TreeView, l10n } from "vscode";
import type { IResourceMeta } from "../doc";
import { CICSPlexTree, CICSRegionTree } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";

/**
 * Reveals resources in the CICS tree by navigating to the appropriate region and filtering.
 *
 * Simplified approach per user requirements:
 * 1. Find profile tree node, getChildren and expand
 * 2. If needed, find CICSplex, getChildren and expand
 * 3. Find region and expand
 * 4. Use Meta to find top level CICSResourceContainerNode
 * 5. Set criteria on it and getChildren/expand
 *
 * @param tree - The CICS tree instance
 * @param treeview - The tree view instance
 * @param profileName - Name of the profile to navigate to
 * @param cicsplexName - Optional CICSplex name if navigating through plex structure
 * @param regionName - Name of the region to navigate to
 * @param resourceMeta - Metadata for the resource type to reveal
 * @param criteria - Array of resource names/identifiers to filter by
 * @returns Promise that resolves when resources are revealed
 */
export async function revealResourceInTree(
  tree: CICSTree,
  treeview: TreeView<any>,
  profileName: string,
  cicsplexName: string | undefined,
  regionName: string,
  resourceMeta: IResourceMeta<any>,
  criteria: string[]
): Promise<void> {
  //  Find profile tree node, getChildren and expand
  const sessionNode = tree.getLoadedProfiles().find((session) => session.getProfile().name === profileName);
  if (!sessionNode) {
    throw new Error(l10n.t("Profile '{0}' not found in the tree.", profileName));
  }

  await treeview.reveal(sessionNode, { expand: true, select: false, focus: false });

  //  If needed, find CICSplex, getChildren and expand
  let regionNode: CICSRegionTree | undefined;

  if (cicsplexName) {
    const plexNode = sessionNode.children?.find(
      (child) => child instanceof CICSPlexTree && child.plexName === cicsplexName
    ) as CICSPlexTree | undefined;

    if (plexNode) {
      await plexNode.getChildren();
      await treeview.reveal(plexNode, { expand: true, select: false, focus: false });

      //  Wait for regionsContainer to be expanded
      const regionsContainer = plexNode.children?.find(
        (child) => child instanceof CICSRegionsContainer
      ) as CICSRegionsContainer | undefined;

      if (regionsContainer) {
        await regionsContainer.getChildren();
        await treeview.reveal(regionsContainer, { expand: true, select: false, focus: false });
        regionNode = regionsContainer.children?.find((r) => r.getRegionName() === regionName);
      }
    }
  } else {
    // Direct region under session
    regionNode = sessionNode.children?.find(
      (child) => child instanceof CICSRegionTree && child.getRegionName() === regionName
    ) as CICSRegionTree | undefined;
  }

  //  Find region and expand
  if (!regionNode) {
    throw new Error(l10n.t("Region '{0}' not found", regionName));
  }

  await treeview.reveal(regionNode, { expand: true, select: false, focus: false });

  //  Use Meta to find top level CICSResourceContainerNode
  const resourceContainer = regionNode.getContainerNodeForResourceType(resourceMeta);
  if (!resourceContainer) {
    throw new Error(
      l10n.t(
        "{0} resources not found in region '{1}'. They may be disabled in settings.",
        resourceMeta.humanReadableNamePlural,
        regionName
      )
    );
  }

  //  Set criteria on it (this can be as many resources as needed, meta builds the criteria for you)
  resourceContainer.reset();
  resourceContainer.setCriteria(criteria);
  resourceContainer.description = criteria.join(" OR ");

  tree.refresh(resourceContainer);
  await treeview.reveal(resourceContainer, { expand: true, select: false, focus: false });

}

/**
 * Reveals child resources within parent resources in the CICS tree.
 * This is useful for resources like Library Datasets that are children of Libraries.
 *
 * @param tree - The CICS tree instance
 * @param treeview - The tree view instance
 * @param profileName - Name of the profile to navigate to
 * @param cicsplexName - Optional CICSplex name if navigating through plex structure
 * @param regionName - Name of the region to navigate to
 * @param parentMeta - Metadata for the parent resource type
 * @param parentCriteria - Array of parent resource names/identifiers to filter by
 * @param childCriteriaMap - Map of parent resource names to their child criteria
 * @returns Promise that resolves when child resources are revealed
 */
export async function revealChildResourcesInTree(
  tree: CICSTree,
  treeview: TreeView<any>,
  profileName: string,
  cicsplexName: string | undefined,
  regionName: string,
  parentMeta: IResourceMeta<any>,
  parentCriteria: string[],
  childCriteriaMap: Map<string, string[]>
): Promise<void> {
  // First reveal the parent resources
  await revealResourceInTree(
    tree,
    treeview,
    profileName,
    cicsplexName,
    regionName,
    parentMeta,
    parentCriteria
  );

  // Find the region node to access parent container
  const regionNode = await findRegionNode(tree, profileName, cicsplexName, regionName);
  if (!regionNode) {
    return;
  }

  // Get parent container and set criteria on children
  await setChildCriteriaOnParents(regionNode, parentMeta, childCriteriaMap, treeview);
}

/**
 * Helper function to find the region node in the tree
 */
async function findRegionNode(
  tree: CICSTree,
  profileName: string,
  cicsplexName: string | undefined,
  regionName: string
): Promise<CICSRegionTree | undefined> {
  const sessionNode = tree.getLoadedProfiles().find((session) => session.getProfile().name === profileName);
  if (!sessionNode) {
    return undefined;
  }

  if (cicsplexName) {
    return findRegionInPlex(sessionNode, cicsplexName, regionName);
  }

  return sessionNode.children?.find(
    (child: any) => child instanceof CICSRegionTree && child.getRegionName() === regionName
  ) as CICSRegionTree | undefined;
}

/**
 * Helper function to find region within a CICSplex
 */
function findRegionInPlex(
  sessionNode: any,
  cicsplexName: string,
  regionName: string
): CICSRegionTree | undefined {
  const plexNode = sessionNode.children?.find(
    (child: any) => child instanceof CICSPlexTree && child.plexName === cicsplexName
  );

  if (!plexNode) {
    return undefined;
  }

  const regionsContainer = plexNode.children?.find(
    (child: any) => child instanceof CICSRegionsContainer
  );

  if (!regionsContainer || !('children' in regionsContainer)) {
    return undefined;
  }

  return (regionsContainer as any).children?.find(
    (r: any) => r.getRegionName && r.getRegionName() === regionName
  );
}

/**
 * Helper function to set criteria on child resources within parent nodes
 */
async function setChildCriteriaOnParents(
  regionNode: CICSRegionTree,
  parentMeta: IResourceMeta<any>,
  childCriteriaMap: Map<string, string[]>,
  treeview: TreeView<any>
): Promise<void> {
  const parentContainer = regionNode.getContainerNodeForResourceType(parentMeta);
  if (!parentContainer || !parentContainer.children) {
    return;
  }

  for (const parentNode of parentContainer.children as any[]) {
    if (!parentNode.getContainedResource) {
      continue;
    }

    const parentName = parentMeta.getName(parentNode.getContainedResource().resource);
    const childCriteria = childCriteriaMap.get(parentName);

    if (childCriteria && childCriteria.length > 0) {
      parentNode.clearCriteria();
      await parentNode.getFetcher()?.reset();
      parentNode.setCriteria(childCriteria);
      await treeview.reveal(parentNode, { expand: true, select: false, focus: false });
    }
  }
}