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

import { SupportedResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { IProfileLoaded } from "@zowe/imperative";
import { Gui } from "@zowe/zowe-explorer-api";
import { commands, ExtensionContext, InputBoxOptions, l10n, ProgressLocation, QuickPickItem, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSMessages } from "../constants/CICS.messages";
import { getMetas, IResource, IResourceMeta } from "../doc";
import { ICICSRegionWithSession } from "../doc/commands/ICICSRegionWithSession";
import { IResourcesHandler } from "../doc/resources/IResourcesHandler";
import { Resource, ResourceContainer } from "../resources";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSLogger } from "../utils/CICSLogger";
import { ProfileManagement } from "../utils/profileManagement";
import { getLastUsedRegion } from "./setCICSRegionCommand";

async function showInspectResource(context: ExtensionContext, resourcesHandler: IResourcesHandler, node: CICSResourceContainerNode<IResource>) {
  // Will only have one resource
  const resource: Resource<IResource>[] = resourcesHandler.resources[0];

  // Makes the "CICS Resource Inspector" tab visible in the panel
  commands.executeCommand("setContext", "cics-extension-for-zowe.showResourceInspector", true);
  // Focuses on the tab in the panel - previous command not working for me??
  commands.executeCommand("resource-inspector.focus");

  await ResourceInspectorViewProvider.getInstance(context).setNode(node).setResourceHandlerMap(resourcesHandler).setResource({
    resource: resource[0],
    meta: resourcesHandler.resourceContainer.getMeta(),
  });
}

export async function inspectResourceByNode(context: ExtensionContext, node: CICSResourceContainerNode<IResource>) {
  const region = node.regionName !== undefined ? node.regionName : node.getContainedResource().resource.attributes.eyu_cicsname;
  const parentResource = (node.getParent() as CICSResourceContainerNode<IResource>)?.getContainedResource()?.resource;

  const resourcesHandler: IResourcesHandler = await loadResourcesWithProgress(
    node.getContainedResource().meta,
    node.getContainedResourceName(),
    region,
    node.cicsplexName,
    node.getProfile(),
    parentResource
  );

  if (resourcesHandler) {
    await showInspectResource(context, resourcesHandler, node);
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

    const resourcesHandler: IResourcesHandler = await loadResourcesWithProgress(
      type,
      resourceName,
      cicsRegion.regionName,
      cicsRegion.cicsPlexName,
      cicsRegion.profile
    );

    if (resourcesHandler) {
      await showInspectResource(context, resourcesHandler, null);
    }
  }
}

export async function inspectResourceCallBack(
  context: ExtensionContext,
  resourceName: string,
  resourceType: string,
  resourceHandlerMap: {
    key: string;
    value: string;
  }[],
  node: CICSResourceContainerNode<IResource>
) {
  const profileValue = resourceHandlerMap.find((item) => item.key === "profile")?.value;
  const regionValue = resourceHandlerMap.find((item) => item.key === "region")?.value;
  const cicsplex = resourceHandlerMap.find((item) => item.key === "cicsplex")?.value;
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileValue);

  const resourcesHandler: IResourcesHandler = await loadResources(getResourceType(resourceType), resourceName, regionValue, cicsplex, profile);

  showInspectResource(context, resourcesHandler, node);
}

async function loadResourcesWithProgress(
  resourceType: IResourceMeta<IResource>,
  resourceName: string,
  regionName: string,
  cicsplex: string,
  profile: IProfileLoaded,
  parentResource?: Resource<IResource>
) {
  let resourcesHandler: IResourcesHandler;
  await window.withProgress(
    {
      title: CICSMessages.CICSLoadingResourceName.message.replace("%name%", resourceName),
      location: ProgressLocation.Notification,
      cancellable: false,
    },
    async (progress, token) => {
      token.onCancellationRequested(() => {});

      resourcesHandler = await loadResources(resourceType, resourceName, regionName, cicsplex, profile, parentResource);
    }
  );
  return resourcesHandler;
}

export async function inspectResource(context: ExtensionContext) {
  const cicsRegion: ICICSRegionWithSession = await getLastUsedRegion();

  if (cicsRegion) {
    const resourceType = await selectResourceType();
    if (resourceType) {
      const resourceName = await selectResource(resourceType);

      if (resourceName) {
        const resourcesHandler: IResourcesHandler = await loadResourcesWithProgress(
          resourceType,
          resourceName,
          cicsRegion.regionName,
          cicsRegion.cicsPlexName,
          cicsRegion.profile
        );

        if (resourcesHandler) {
          await showInspectResource(context, resourcesHandler, null);
        }
      }
    }
  }
}

async function loadResources(
  resourceType: IResourceMeta<IResource>,
  resourceName: string,
  regionName: string,
  cicsplex: string,
  profile: IProfileLoaded,
  parentResource?: Resource<IResource>
): Promise<IResourcesHandler> {
  const resourceContainer = new ResourceContainer<IResource>(resourceType, parentResource);
  resourceContainer.setCriteria([resourceName]);

  resourceContainer.setProfileName(profile.name);
  const resources: [Resource<IResource>[], boolean] = await resourceContainer.loadResources(profile, regionName, cicsplex);

  if (resources[0].length === 0) {
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


