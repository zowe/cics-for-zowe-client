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

import { IResource, IResourceProfileNameInfo, SupportedResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { Gui } from "@zowe/zowe-explorer-api";
import { commands, ExtensionContext, InputBoxOptions, l10n, ProgressLocation, QuickPickItem, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSMessages } from "../constants/CICS.messages";
import { getMetas, IContainedResource, IResourceMeta } from "../doc";
import { ICICSRegionWithSession } from "../doc/commands/ICICSRegionWithSession";
import { Resource, ResourceContainer, SessionHandler } from "../resources";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSLogger } from "../utils/CICSLogger";
import { getLastUsedRegion } from "./setCICSRegionCommand";

async function showInspectResource(
  context: ExtensionContext,
  resource: IContainedResource<IResource>,
  resourceContext: IResourceProfileNameInfo,
  node?: CICSResourceContainerNode<IResource>
) {

  // Makes the "CICS Resource Inspector" tab visible in the panel
  commands.executeCommand("setContext", "cics-extension-for-zowe.showResourceInspector", true);
  // Focuses on the tab in the panel - previous command not working for me??
  commands.executeCommand("resource-inspector.focus");

  await ResourceInspectorViewProvider.getInstance(context).setNode(node).setResourceContext(resourceContext).setResource(resource);
}

export async function inspectResourceByNode(context: ExtensionContext, node: CICSResourceContainerNode<IResource>) {

  const resourceContext: IResourceProfileNameInfo = {
    profileName: node.getProfile().name,
    cicsplexName: node.cicsplexName,
    regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
  };

  const upToDateResource = await loadResourcesWithProgress(
    node.getContainedResource().meta,
    node.getContainedResourceName(),
    resourceContext,
    (node.getParent() as CICSResourceContainerNode<IResource>)?.getContainedResource()?.resource,
  );

  if (upToDateResource) {
    await showInspectResource(context, upToDateResource, resourceContext, node);
  }
}

export async function inspectResourceByName(context: ExtensionContext, resourceName: string, resourceType: string) {
  // Inspecting a resource by its name so this will be on the focus region
  const cicsRegion: ICICSRegionWithSession = await getLastUsedRegion();

  if (cicsRegion) {
    const type = getResourceType(resourceType);

    if (!type) {
      // Error if resource type not found
      const message = CICSMessages.CICSResourceTypeNotFound.message.replace("%resource-type%", resourceType);
      CICSLogger.error(message);
      window.showErrorMessage(message);
      return;
    }

    const resourceContext: IResourceProfileNameInfo = {
      profileName: cicsRegion.profile.name,
      cicsplexName: cicsRegion.cicsPlexName,
      regionName: cicsRegion.regionName,
    };

    const upToDateResource = await loadResourcesWithProgress(type, resourceName, resourceContext);
    if (upToDateResource) {
      await showInspectResource(context, upToDateResource, resourceContext);
    }
  }
}

export async function inspectResourceCallBack(
  context: ExtensionContext,
  resource: IContainedResource<IResource>,
  resourceContext: IResourceProfileNameInfo,
  node?: CICSResourceContainerNode<IResource>,
) {

  const resources = await loadResources(resource.meta, resource.meta.getName(resource.resource), resourceContext);
  await showInspectResource(context, {
    meta: resource.meta,
    resource: resources[0]
  }, resourceContext, node);
}

async function loadResourcesWithProgress(
  resourceType: IResourceMeta<IResource>,
  resourceName: string,
  resourceContext: IResourceProfileNameInfo,
  parentResource?: Resource<IResource>
) {
  return await window.withProgress(
    {
      title: CICSMessages.CICSLoadingResourceName.message.replace("%name%", resourceName),
      location: ProgressLocation.Notification,
      cancellable: false,
    },
    async (progress, token) => {
      token.onCancellationRequested(() => {});

      const resources = await loadResources(resourceType, resourceName, resourceContext, parentResource);
      if (!resources) {
        return;
      }

      return {
        meta: resourceType,
        resource: resources[0],
      };
    }
  );
}

export async function inspectResource(context: ExtensionContext) {
  const cicsRegion: ICICSRegionWithSession = await getLastUsedRegion();

  if (cicsRegion) {
    const resourceType = await selectResourceType();
    if (resourceType) {
      const resourceName = await selectResource(resourceType);

      if (resourceName) {
        const resourceContext: IResourceProfileNameInfo = {
          profileName: cicsRegion.profile.name,
          cicsplexName: cicsRegion.cicsPlexName,
          regionName: cicsRegion.regionName,
        };

        const upToDateResource = await loadResourcesWithProgress(resourceType, resourceName, resourceContext);
        if (upToDateResource) {
          await showInspectResource(context, upToDateResource, resourceContext);
        }
      }
    }
  }
}

async function loadResources(
  resourceType: IResourceMeta<IResource>,
  resourceName: string,
  resourceContext: IResourceProfileNameInfo,
  parentResource?: Resource<IResource>
): Promise<Resource<IResource>[]> {
  const resourceContainer = new ResourceContainer(resourceType, parentResource);
  resourceContainer.setCriteria([resourceName]);
  const resources = await resourceContainer.loadResources(SessionHandler.getInstance().getProfile(resourceContext.profileName), resourceContext.regionName, resourceContext.cicsplexName);

  if (resources[0].length === 0) {
    const hrn = resourceType.humanReadableNameSingular;
    const message = CICSMessages.CICSResourceNotFound.message.replace("%resource-type%", hrn).replace("%resource-name%", resourceName).replace("%region-name%", resourceContext.regionName);

    CICSLogger.error(message);
    window.showErrorMessage(message);
    return;
  }

  return resources[0];
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
  const qpItems: QuickPickItem[] = [...items.map((item) => ({ label: item }))];

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

    validateInput: (value: string): string | undefined => {
      const maxLength = resourceType.maximumPrimaryKeyLength ?? constants.MAX_RESOURCE_NAME_LENGTH;
      const tooLongErrorMessage = CICSMessages.CICSInvalidResourceNameLength.message.replace("%length%", `${maxLength}`);

      return value.length > maxLength ? tooLongErrorMessage : undefined;
    }
  };

  return (await window.showInputBox(options)) || undefined;
}


