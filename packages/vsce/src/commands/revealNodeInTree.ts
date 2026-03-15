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

import type { IResource, IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { type TreeView, l10n, window } from "vscode";
import type { IResourceMeta } from "../doc";
import { CICSResourceContainerNode, CICSPlexTree, CICSRegionTree } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { findSelectedNodes } from "../utils/commandUtils";

/**
 * Invocation source types for commands
 */
export enum InvocationSource {
  /** Command invoked from a region tree node */
  RegionTree = "RegionTree",
  /** Command invoked from an "All X" tree (e.g., "All Local Transactions", "All Tasks") at CICSplex level */
  AllResourcesTree = "AllResourcesTree",
  /** Command invoked from the Resource Inspector */
  ResourceInspector = "ResourceInspector",
}

/**
 * Unified resource item that works for both tree nodes and inspector resources
 */
export interface IUnifiedResourceItem<T extends IResource> {
  /** The resource attributes */
  resource: T;
  /** The resource context (profile, session, region, plex) */
  context: IResourceContext;
  /** The resource metadata */
  meta: IResourceMeta<T>;
}

/**
 * Result of checking where a command was invoked from
 */
export interface ICommandInvocationContext<T extends IResource> {
  /** The source from which the command was invoked */
  source: InvocationSource;
  /** Unified array of resource items (works for both tree nodes and inspector resources) */
  resources: IUnifiedResourceItem<T>[];
}

/**
 * Determines where a command was invoked from and returns a unified array of resources.
 * This eliminates the need for callers to check different variables based on invocation source.
 *
 * @param treeview - The tree view instance
 * @param resourceMeta - The resource metadata to filter nodes
 * @param node - The node parameter passed to the command
 * @param tree - The CICS tree instance
 * @returns Context with source and unified resources array
 */
export function getCommandInvocationContext<T extends IResource>(
  treeview: TreeView<any>,
  resourceMeta: IResourceMeta<T>,
  node: any,
  tree: CICSTree
): ICommandInvocationContext<T> {
  // Try to find selected nodes
  const nodes = findSelectedNodes(treeview, resourceMeta, node) as CICSResourceContainerNode<T>[];
  
  // Check if nodes exist and if they have a parent
  const hasNodes = nodes && nodes.length > 0;
  const isFromInspector = hasNodes && !nodes[0].getParent();
  
  // Determine the invocation source
  let source: InvocationSource;
  let resources: IUnifiedResourceItem<T>[] = [];
  
  if (isFromInspector) {
    // Resource Inspector: Get resources from inspector
    source = InvocationSource.ResourceInspector;
    const resourceInspector = ResourceInspectorViewProvider.getInstance(null, tree);
    const inspectorResources = resourceInspector?.getResources();
    
    if (inspectorResources && inspectorResources.length > 0) {
      resources = inspectorResources.map((item) => ({
        resource: item.resource as T,
        context: item.context,
        meta: item.meta as IResourceMeta<T>,
      }));
    }
  } else if (hasNodes) {
    // Tree nodes: Convert nodes to unified format
    // Check if parent label starts with "All " (e.g., "All Local Transactions", "All Tasks")
    const parentLabel = nodes[0].getParent()?.label;
    if (parentLabel && typeof parentLabel === "string" && parentLabel.startsWith("All ")) {
      source = InvocationSource.AllResourcesTree;
    } else {
      source = InvocationSource.RegionTree;
    }
    
    // Convert tree nodes to unified resource items
    resources = nodes.map((treeNode) => {
      const containedResource = treeNode.getContainedResource();
      return {
        resource: containedResource.resource.attributes as T,
        context: {
          profile: treeNode.getProfile(),
          session: treeNode.getSession(),
          regionName: treeNode.regionName,
          cicsplexName: treeNode.cicsplexName,
        },
        meta: containedResource.meta as IResourceMeta<T>,
      };
    });
  } else {
    // Default to region tree if we can't determine
    source = InvocationSource.RegionTree;
  }
  
  return {
    source,
    resources,
  };
}

export interface IRevealResourceOptions {
  tree: CICSTree;
  treeview: TreeView<any>;
  context: IResourceContext;
  resourceMeta: IResourceMeta<any>;
  resourceName?: string;
  resourceNames?: string[];
  selectAndFocus?: boolean;
  clearFilter?: boolean;
  customDescription?: string;
  customSuccessMessage?: string;
}

/**
 * Reveals a resource or multiple resources in the CICS tree by navigating to the appropriate region,
 * filtering the resource container, and selecting the specific resource node(s).
 *
 * This utility function handles:
 * - Finding the session node by profile name
 * - Navigating through CICSplex structure if applicable
 * - Finding the target region
 * - Getting the resource container for the specified resource type
 * - Applying filter criteria (single resource, multiple resources, or clear filter)
 * - Revealing and selecting the resource node(s)
 *
 * @param options - Configuration options for revealing the resource(s)
 * @returns Promise that resolves when the resource(s) is revealed, or rejects with an error
 */
// eslint-disable-next-line complexity
export async function revealResourceInTree(options: IRevealResourceOptions): Promise<void> {
  const {
    tree,
    treeview,
    context,
    resourceMeta,
    resourceName,
    resourceNames,
    selectAndFocus = true,
    clearFilter = false,
    customDescription,
    customSuccessMessage
  } = options;

  // Validate that either resourceName or resourceNames is provided (unless clearFilter is true)
  if (!clearFilter && !resourceName && (!resourceNames || resourceNames.length === 0)) {
    throw new Error("Either resourceName or resourceNames must be provided when not clearing filter");
  }

  // Determine the filter criteria
  const filterCriteria = resourceNames || (resourceName ? [resourceName] : []);
  const isMultipleResources = filterCriteria.length > 1;

  // Find the session node
  const sessionNode = tree.getLoadedProfiles().find((session) => session.getProfile().name === context.profile.name);
  if (!sessionNode) {
    throw new Error(l10n.t("Profile '{0}' not found in the tree.", context.profile.name));
  }

  // Expand session node if collapsed
  await treeview.reveal(sessionNode, { expand: true, select: false, focus: false });

  // Find the region node
  let regionNode: CICSRegionTree | undefined;

  if (context.cicsplexName) {
    // Navigate through CICSplex structure
    // Compare using plexName property directly to match the full plex name from context
    const plexNode = sessionNode.children?.find(
      (child) => child instanceof CICSPlexTree && child.plexName === context.cicsplexName
    ) as CICSPlexTree | undefined;

    if (plexNode) {
      // Ensure plex children are loaded before revealing (critical when plex is collapsed)
      await plexNode.getChildren();
      
      await treeview.reveal(plexNode, { expand: true, select: false, focus: false });

      const regionsContainer = plexNode.children?.find(
        (child) => child instanceof CICSRegionsContainer
      ) as CICSRegionsContainer | undefined;

      if (regionsContainer) {
        // Ensure regions are loaded before revealing (critical when container is collapsed)
        await regionsContainer.getChildren();
        
        await treeview.reveal(regionsContainer, { expand: true, select: false, focus: false });
        regionNode = regionsContainer.children?.find((r) => r.getRegionName() === context.regionName);
      }
    }
  } else {
    // Direct region under session
    regionNode = sessionNode.children?.find(
      (child) => child instanceof CICSRegionTree && child.getRegionName() === context.regionName
    ) as CICSRegionTree | undefined;
  }

  if (!regionNode) {
    throw new Error(l10n.t("Region '{0}' not found", context.regionName));
  }

  // Get the resource container for the specified resource type
  const resourceContainer = regionNode.getContainerNodeForResourceType(resourceMeta);
  if (!resourceContainer) {
    throw new Error(
      l10n.t(
        "{0} resources not found in region '{1}'. They may be disabled in settings.",
        resourceMeta.humanReadableNamePlural,
        context.regionName
      )
    );
  }

  // Reveal the region node
  try {
    await treeview.reveal(regionNode, { expand: true, select: false, focus: false });
  } catch (_error) {
    // Ignore reveal errors - node might already be visible
  }

  // Apply filter and refresh
  resourceContainer.reset();
  
  if (clearFilter) {
    // Clear any existing filter to show all resources
    resourceContainer.clearCriteria();
    resourceContainer.description = undefined;
  } else {
    // Apply specific filter for the resource(s)
    resourceContainer.setCriteria(filterCriteria);
    resourceContainer.description = customDescription || filterCriteria.join(" OR ");
  }
  
  tree.refresh(resourceContainer);

  // Reveal the resource container
  try {
    const selectAndFocusContainer = isMultipleResources || !selectAndFocus;
    await treeview.reveal(resourceContainer, {
      expand: true,
      select: selectAndFocusContainer,
      focus: selectAndFocusContainer,
    });
  } catch (_error) {
    // Ignore reveal errors
  }

  if (!clearFilter) {
    if (isMultipleResources) {
      // For multiple resources, just show the container with filter applied
      if (customSuccessMessage) {
        window.showInformationMessage(customSuccessMessage);
      } else {
        window.showInformationMessage(
          l10n.t("Found {0} {1} and filter applied", filterCriteria.length, resourceMeta.humanReadableNamePlural.toLowerCase())
        );
      }
    } else {
      // For single resource, check if custom success message is provided
      if (customSuccessMessage) {
        // Use custom success message instead of trying to find specific node
        window.showInformationMessage(customSuccessMessage);
      } else {
        // Find and reveal the specific resource node
        const children = await resourceContainer.getChildren();
        if (children && children.length > 0) {
          const resourceNode = children.find((child) => {
            if (child instanceof CICSResourceContainerNode && child.getContainedResource()) {
              const resource = child.getContainedResource().resource;
              const childResourceName = resourceMeta.getName(resource as any);
              return childResourceName === resourceName;
            }
            return false;
          }) as CICSResourceContainerNode<IResource>;

          if (resourceNode) {
            try {
              await treeview.reveal(resourceNode, { expand: false, select: selectAndFocus, focus: selectAndFocus });
              window.showInformationMessage(
                l10n.t("{0} '{1}' revealed in the tree", resourceMeta.humanReadableNameSingular, resourceName)
              );
            } catch (_error) {
              window.showInformationMessage(
                l10n.t("{0} '{1}' found and filter applied", resourceMeta.humanReadableNameSingular, resourceName)
              );
            }
          } else {
            // Resource not found in children - just show filter applied message instead of warning
            const displayName = filterCriteria.length === 1 ? filterCriteria[0] : filterCriteria.join(", ");
            window.showInformationMessage(
              `${resourceMeta.humanReadableNameSingular} '${displayName}' found and filter applied`
            );
          }
        } else {
          const noMatchMsg = l10n.t(
            "No {0} found matching '{1}' in region '{2}'",
            resourceMeta.humanReadableNamePlural.toLowerCase(),
            resourceName,
            context.regionName
          );
          window.showWarningMessage(noMatchMsg);
        }
      }
    }
  } else {
    // When clearing filter, just show informational message
    window.showInformationMessage(
      l10n.t("Showing all {0} in region '{1}'", resourceMeta.humanReadableNamePlural.toLowerCase(), context.regionName)
    );
  }
}