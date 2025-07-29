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

import { commands, ExtensionContext, InputBoxOptions, l10n, QuickPickItem, window } from "vscode";
import { CICSMessages } from "../constants/CICS.messages";
import { getMetas, IResource, IResourceMeta, TransactionMeta } from "../doc";
import { Resource, ResourceContainer } from "../resources";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSLogger } from "../utils/CICSLogger";
import { IFocusRegion } from "../doc/commands/IFocusRegion";
import { getFocusRegion } from "./setFocusRegionCommand";
import { IResourcesHandler } from "../doc/resources/IResourcesHandler";
import { Gui } from "@zowe/zowe-explorer-api";
import constants from "../constants/CICS.defaults";
import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { SupportedResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

async function showInspectResource(context: ExtensionContext, resourcesHandler: IResourcesHandler) {
  // Will only have one resource
  const resource: Resource<IResource>[] = resourcesHandler.resources[0];

  // Makes the "CICS Resource Inspector" tab visible in the panel
  commands.executeCommand("setContext", "cics-extension-for-zowe.showResourceInspector", true);
  // Focuses on the tab in the panel - previous command not working for me??
  commands.executeCommand("resource-inspector.focus");

  await ResourceInspectorViewProvider.getInstance(context.extensionUri).setResourceHandlerMap(resourcesHandler).setResource({
    resource: resource[0],
    meta: resourcesHandler.resourceContainer.getMeta(),
  });
}

export async function inspectResourceByNode(context: ExtensionContext, node: CICSResourceContainerNode<IResource>) {
  const region = node.regionName !== undefined ? node.regionName : node.description.toString().replace("(", "").replace(")", "");
  const resourcesHandler: IResourcesHandler = await loadResources(
    node.getSession(),
    node.getContainedResource().meta,
    node.getContainedResourceName(),
    region,
    node.cicsplexName,
    node.getProfileName()
  );

  if (resourcesHandler) {
    await showInspectResource(context, resourcesHandler);
  }
}

export async function inspectResourceByName(context: ExtensionContext, resourceName: string, resourceType: string) {
  // Inspecting a resource by its name so this will be on the focus region
  const focusRegion: IFocusRegion = await getFocusRegion();

  if (focusRegion) {
    const type = getResourceType(resourceType);

    if (!type) {
      // Error if resource type not found
      CICSLogger.error(CICSMessages.CICSResourceTypeNotFound.message);
      window.showErrorMessage(CICSMessages.CICSResourceTypeNotFound.message);
      return;
    }

    const resourcesHandler: IResourcesHandler = await loadResources(
      focusRegion.session,
      type,
      resourceName,
      focusRegion.focusSelectedRegion,
      focusRegion.cicsPlexName,
      focusRegion.profile.name
    );

    if (resourcesHandler) {
      await showInspectResource(context, resourcesHandler);
    }
  }
}

export async function inspectResource(context: ExtensionContext) {
  const focusRegion: IFocusRegion = await getFocusRegion();

  if (focusRegion) {
    const resourceType = await selectResourceType();
    if (resourceType) {
      const resourceName = await selectResource(resourceType);

      if (resourceName) {
        const resourcesHandler: IResourcesHandler = await loadResources(
          focusRegion.session,
          resourceType,
          resourceName,
          focusRegion.focusSelectedRegion,
          focusRegion.cicsPlexName,
          focusRegion.profile.name
        );

        if (resourcesHandler) {
          await showInspectResource(context, resourcesHandler);
        }
      }
    }
  }
}

async function loadResources(
  session: CICSSession,
  resourceType: IResourceMeta<IResource>,
  resourceName: string,
  regionName: string,
  cicsplex: string,
  profileName: string
): Promise<IResourcesHandler> {
  const resourceContainer = new ResourceContainer<IResource>(resourceType);
  resourceContainer.setCriteria([resourceName]);

  resourceContainer.setProfileName(profileName);
  const resources: [Resource<IResource>[], boolean] = await resourceContainer.loadResources(session, regionName, cicsplex);

  if (resources[0].length === 0 ) {
    const hrn = resourceType.humanReadableNameSingular;
    const message = CICSMessages.CICSResourceNotFound.message.replace("%resource-type%", hrn).replace("%resource-name%", resourceName).replace("%region-name%", regionName);
    CICSLogger.error(message);
    window.showErrorMessage(message);
    return;
  }

  return { resources, resourceContainer };
}

function getResourceType(resourceName: string): IResourceMeta<IResource> {
  const types: IResourceMeta<IResource>[] = getMetas().filter((value) => value.resourceName == resourceName);

  // Should only have one
  if (types?.length > 0) {
    return types[0];
  }
  return undefined;
}

export function getInspectableResourceTypes(): Map<string, IResourceMeta<IResource>> {
  const resourceTypeMap = getMetas().reduce((acc, item) => {
    // for now we only show our externally visible types (so not LIBDSN)
    if (SupportedResourceTypes.filter((res) => res == item.resourceName).length > 0) {
      acc.set(item.humanReadableNameSingular, item);
    }
    return acc;
  }, new Map());
  return resourceTypeMap;
}

async function selectResourceType(): Promise<IResourceMeta<IResource> | undefined> {
  // map with the nice name of the resource type "Local File" etc mapping onto the resource meta type
  const resourceTypeMap = getInspectableResourceTypes();

  const choice = await getChoiceFromQuickPick(CICSMessages.CICSSelectResourceType.message, Array.from(resourceTypeMap.keys()));

  if (choice) {
    return resourceTypeMap.get(choice.label);
  }

  return undefined;
}

async function selectResource(resourceType: IResourceMeta<IResource>): Promise<string | undefined> {
  return getEntryFromInputBox(resourceType);
}

async function getChoiceFromQuickPick(
  placeHolder: string,
  items: string[]
): Promise<QuickPickItem | undefined> {
  const qpItems: QuickPickItem[] = [...items.map((item) => ({ label: item}))];

  const quickPick = Gui.createQuickPick();
  quickPick.items = qpItems;
  quickPick.placeholder = l10n.t(placeHolder);
  quickPick.ignoreFocusOut = true;
  quickPick.show();
  const choice = await Gui.resolveQuickPick(quickPick);
  quickPick.hide();
  return choice;
}

async function getEntryFromInputBox(resourceType: IResourceMeta<IResource>): Promise<string | undefined> {
  const options: InputBoxOptions = {
    prompt: CICSMessages.CICSEnterResourceName.message.replace("%resource-human-readable%", resourceType.humanReadableNameSingular),
    value: "",
    validateInput: function(value: string): string {
      if (resourceType === TransactionMeta && value.length > constants.MAX_TRANS_RESOURCE_NAME_LENGTH) {
        return CICSMessages.CICSInvalidResourceNameLength.message.replace("%length%", String(constants.MAX_TRANS_RESOURCE_NAME_LENGTH));
      } else if (resourceType !== TransactionMeta && value.length > constants.MAX_RESOURCE_NAME_LENGTH) {
        return CICSMessages.CICSInvalidResourceNameLength.message.replace("%length%", String(constants.MAX_RESOURCE_NAME_LENGTH));
      }
      return undefined;
    }
  };

  return (await window.showInputBox(options)) || undefined;
}


