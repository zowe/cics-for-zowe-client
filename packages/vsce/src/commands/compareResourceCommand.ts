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
import { Gui, MessageSeverity } from "@zowe/zowe-explorer-api";
import { ExtensionContext, InputBoxOptions, commands, l10n, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSMessages } from "../constants/CICS.messages";
import { IContainedResource, IResourceMeta } from "../doc";
import { Resource, ResourceContainer } from "../resources";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSLogger } from "../utils/CICSLogger";
import { IResourceInspectorResource } from "../webviews/common/vscode";
import { showInspectResource } from "./inspectResourceCommandUtils";
import { getLastUsedRegion } from "./setCICSRegionCommand";

export function getCompareResourceFromInspectorCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.compareResourceFromInspector", async (node: CICSResourceContainerNode<IResource>) => {
    // Get the current resource from the Resource Inspector
    const resourceInspector = ResourceInspectorViewProvider.getInstance(context);
    const currentResources = resourceInspector.getResources();

    if (!currentResources || currentResources.length === 0) {
      await window.showErrorMessage(l10n.t("No resource is currently open in the Resource Inspector"));
      return;
    }

    // Use the first resource as the base for comparison
    const currentResource = currentResources[0];

    await compareResourceFromInspector(currentResource, context);
  });
}

export function getCompareTreeResourceCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.compareTreeResource", async (node: CICSResourceContainerNode<IResource>) => {
    if (!node) {
      await window.showErrorMessage(l10n.t("No CICS resource selected"));
      return;
    }

    const nodeMeta = node.getContainedResource().meta;
    const nodeResource = node.getContainedResource().resource;

    if (!nodeMeta || !nodeResource) {
      await window.showErrorMessage(l10n.t("No CICS resource information available to compare"));
      return;
    }

    // Convert tree node to IResourceInspectorResource format
    const currentResource: IResourceInspectorResource = {
      resource: nodeResource.attributes,
      meta: nodeMeta,
      context: {
        profile: node.getProfile(),
        session: node.getSession(),
        cicsplexName: node.cicsplexName,
        regionName: node.regionName ?? nodeResource.attributes.eyu_cicsname,
      },
      highlights: nodeMeta.getHighlights(nodeResource),
      name: nodeMeta.getName(nodeResource),
      actions: [], // Not needed for comparison
    };

    await compareResourceFromInspector(currentResource, context);
  });
}

async function compareResourceFromInspector(currentResource: IResourceInspectorResource, context: ExtensionContext) {
  try {
    // Step 1: Select region for comparison using the existing getLastUsedRegion functionality
    const targetRegion = await getLastUsedRegion();
    if (!targetRegion) {
      return; // User cancelled
    }

    // Step 2: Prompt for resource name
    const resourceName = await selectResourceNameForComparison(currentResource.meta, currentResource.name);
    if (!resourceName) {
      return; // User cancelled
    }

    // Step 3: Fetch the second resource
    const secondResource = await loadResourceForComparison(currentResource.meta, resourceName, {
      profileName: targetRegion.profile.name,
      cicsplexName: targetRegion.cicsPlexName,
      regionName: targetRegion.regionName,
    });

    if (!secondResource) {
      return; // Error already shown
    }

    // Step 4: Validate both resources are same type
    if (currentResource.meta.resourceName !== secondResource.meta.resourceName) {
      await Gui.showMessage(l10n.t("Cannot compare CICS resources of different types."), { severity: MessageSeverity.ERROR });
      return;
    }

    // Step 5: Show both resources in compare view
    await showInspectResource(context, [
      {
        containedResource: {
          meta: currentResource.meta,
          resource: new Resource(currentResource.resource),
        },
        ctx: currentResource.context,
      },
      {
        containedResource: secondResource,
        ctx: {
          profile: targetRegion.profile,
          session: targetRegion.session,
          cicsplexName: targetRegion.cicsPlexName,
          regionName: targetRegion.regionName,
        },
      },
    ]);
  } catch (error) {
    CICSLogger.error(`Error comparing resources: ${error.message}`);
    await window.showErrorMessage(l10n.t("Failed to compare resources: {0}", error.message));
  }
}

async function selectResourceNameForComparison(resourceMeta: IResourceMeta<IResource>, currentResourceName: string): Promise<string | undefined> {
  const options: InputBoxOptions = {
    prompt: l10n.t("Enter {0} name to compare with", resourceMeta.humanReadableNameSingular),
    value: currentResourceName,
    validateInput: (value: string): string | undefined => {
      const maxLength = resourceMeta.maximumPrimaryKeyLength ?? constants.MAX_RESOURCE_NAME_LENGTH;
      const tooLongErrorMessage = CICSMessages.CICSInvalidResourceNameLength.message.replace("%length%", `${maxLength}`);

      return value.length > maxLength ? tooLongErrorMessage : undefined;
    },
  };

  return (await window.showInputBox(options)) || undefined;
}

async function loadResourceForComparison(
  resourceMeta: IResourceMeta<IResource>,
  resourceName: string,
  resourceContext: { profileName: string; cicsplexName?: string; regionName: string }
): Promise<IContainedResource<IResource> | undefined> {
  const resourceContainer = new ResourceContainer([resourceMeta], resourceContext);
  resourceContainer.setCriteria([resourceName]);

  const resources = await resourceContainer.fetchNextPage();

  if (resources.length === 0) {
    const message = CICSMessages.CICSResourceNotFound.message
      .replace("%resource-type%", resourceMeta.humanReadableNameSingular)
      .replace("%resource-name%", resourceName)
      .replace("%region-name%", resourceContext.regionName);

    CICSLogger.error(message);
    window.showErrorMessage(message);
    return;
  }

  return resources[0];
}

// Made with Bob
