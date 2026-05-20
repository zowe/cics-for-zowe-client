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

import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { Gui, MessageSeverity } from "@zowe/zowe-explorer-api";
import { QuickPickItemKind, l10n, window, type ExtensionContext, type InputBoxOptions, type QuickPickItem } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSMessages } from "../constants/CICS.messages";
import type { IContainedResource, IResourceMeta } from "../doc";
import { Resource, ResourceContainer } from "../resources";
import type { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { CICSLogger } from "../utils/CICSLogger";
import PersistentStorage from "../utils/PersistentStorage";
import type { IResourceInspectorResource } from "../webviews/common/vscode";
import { showInspectResource } from "./inspectResourceCommandUtils";
import { getLastUsedRegion } from "./setCICSRegionCommand";

/**
 * Helper function to compare a tree node resource with another resource (with prompts)
 * @param node The tree node containing the resource to compare
 * @param context Extension context
 */
export async function compareTreeNodeWithPrompts(node: CICSResourceContainerNode<IResource>, context: ExtensionContext) {
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

    // Record both resources as recently compared
    await PersistentStorage.appendRecentResource({
      resourceName: currentResource.name,
      resourceType: currentResource.meta.resourceName,
    });
    await PersistentStorage.appendRecentResource({
      resourceName: secondResource.meta.getName(secondResource.resource),
      resourceType: secondResource.meta.resourceName,
    });

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    CICSLogger.error(`Error comparing resources: ${errorMessage}`);
    await window.showErrorMessage(l10n.t("Failed to compare resources: {0}", errorMessage));
  }
}

async function selectResourceNameForComparison(resourceMeta: IResourceMeta<IResource>, currentResourceName: string): Promise<string | undefined> {
  // Filter out the current resource from recent resources
  const recentForType = PersistentStorage.getRecentResources().filter(
    (r) => r.resourceType === resourceMeta.resourceName && r.resourceName !== currentResourceName
  );

  // No recent resources for this type — fall back to plain input box
  if (recentForType.length === 0) {
    return selectResourceNameByInputBox(resourceMeta, currentResourceName);
  }

  const ENTER_NAME_LABEL = l10n.t("Enter resource name...");
  const recentSectionLabel = l10n.t("Recent CICS {0}", resourceMeta.humanReadableNamePlural);

  const buildItems = (typedValue?: string): QuickPickItem[] => {
    const items: QuickPickItem[] = [];

    if (typedValue && typedValue.trim().length > 0) {
      items.push({ label: typedValue.trim(), description: l10n.t("Search for this name") });
      items.push({ label: "", kind: QuickPickItemKind.Separator });
    }

    items.push({ label: recentSectionLabel, kind: QuickPickItemKind.Separator });
    for (const r of recentForType) {
      items.push({ label: r.resourceName });
    }
    items.push({ label: "", kind: QuickPickItemKind.Separator });
    items.push({ label: ENTER_NAME_LABEL, description: l10n.t("Type a name to search") });

    return items;
  };

  const quickPick = Gui.createQuickPick();
  quickPick.placeholder = l10n.t("Enter {0} name to compare with", resourceMeta.humanReadableNameSingular);
  quickPick.ignoreFocusOut = true;
  quickPick.items = buildItems();

  quickPick.onDidChangeValue((value) => {
    quickPick.items = buildItems(value);
  });

  quickPick.show();
  const choice = await Gui.resolveQuickPick(quickPick);
  quickPick.hide();

  if (!choice) {
    return undefined;
  }

  // Sentinel item — fall back to input box
  if (choice.label === ENTER_NAME_LABEL) {
    return selectResourceNameByInputBox(resourceMeta, currentResourceName);
  }

  const name = choice.label.trim();
  const maxLength = resourceMeta.maximumPrimaryKeyLength ?? constants.MAX_RESOURCE_NAME_LENGTH;
  if (name.length > maxLength) {
    window.showErrorMessage(CICSMessages.CICSInvalidResourceNameLength.message.replace("%length%", `${maxLength}`));
    return undefined;
  }

  return name || undefined;
}

async function selectResourceNameByInputBox(resourceMeta: IResourceMeta<IResource>, currentResourceName: string): Promise<string | undefined> {
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
