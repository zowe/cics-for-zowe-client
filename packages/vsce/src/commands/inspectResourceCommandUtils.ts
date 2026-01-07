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

import { IResource, IResourceProfileNameInfo, ResourceTypes, SupportedResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { Gui } from "@zowe/zowe-explorer-api";
import { ExtensionContext, InputBoxOptions, ProgressLocation, QuickPickItem, commands, l10n, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSMessages } from "../constants/CICS.messages";
import { IContainedResource, IResourceMeta, LocalFileMeta, RemoteFileMeta, SharedTSQueueMeta, TSQueueMeta, getMetas } from "../doc";
import { ICICSRegionWithSession } from "../doc/commands/ICICSRegionWithSession";
import { Resource, ResourceContainer } from "../resources";
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

  let parentResource: Resource<IResource> | undefined;
  try {
    const parent = node.getParent && node.getParent();
    if (parent && typeof (parent as any).getContainedResource === "function") {
      parentResource = (parent as CICSResourceContainerNode<IResource>).getContainedResource()?.resource;
    }
  } catch (err) {
    parentResource = undefined;
  }

  const upToDateResource = await loadResourcesWithProgress(
    [node.getContainedResource().meta],
    node.getContainedResourceName(),
    resourceContext,
    parentResource
  );

  if (upToDateResource) {
    await showInspectResource(context, upToDateResource, resourceContext, node);
  }
}

export async function inspectResourceByName(context: ExtensionContext, resourceName: string, resourceType: string) {
  // Inspecting a resource by its name so this will be on the focus region
  const cicsRegion: ICICSRegionWithSession = await getLastUsedRegion();

  if (cicsRegion) {
    let type = getResourceType(resourceType);

    if (!type || type.length === 0) {
      // Error if resource type not found
      const message = CICSMessages.CICSResourceTypeNotFound.message.replace("%resource-type%", resourceType);
      CICSLogger.error(message);
      window.showErrorMessage(message);
      return;
    }

    if (type[0] === LocalFileMeta || type[0] === RemoteFileMeta) {
      type = [LocalFileMeta, RemoteFileMeta];
    }
    if (type[0] === TSQueueMeta || type[0] === SharedTSQueueMeta) {
      type = [TSQueueMeta, SharedTSQueueMeta];
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
  node?: CICSResourceContainerNode<IResource>
) {
  const resources = await loadResources([resource.meta], resource.meta.getName(resource.resource), resourceContext);
  await showInspectResource(context, resources, resourceContext, node);
}

async function loadResourcesWithProgress(
  resourceTypes: IResourceMeta<IResource>[],
  resourceName: string,
  resourceContext: IResourceProfileNameInfo,
  parentResource?: Resource<IResource>
) {
  return window.withProgress(
    {
      title: CICSMessages.CICSLoadingResourceName.message.replace("%name%", resourceName),
      location: ProgressLocation.Notification,
      cancellable: false,
    },
    async (progress, token) => {
      token.onCancellationRequested(() => {});

      const resources = await loadResources(resourceTypes, resourceName, resourceContext, parentResource);
      if (!resources) {
        return;
      }

      return resources;
    }
  );
}

export async function inspectResource(context: ExtensionContext) {
  const cicsRegion: ICICSRegionWithSession = await getLastUsedRegion();

  if (cicsRegion) {
    const resourceTypes = await selectResourceType();
    if (resourceTypes) {
      const resourceName = await selectResource(resourceTypes.name, resourceTypes.meta[0].maximumPrimaryKeyLength);

      if (resourceName) {
        const resourceContext: IResourceProfileNameInfo = {
          profileName: cicsRegion.profile.name,
          cicsplexName: cicsRegion.cicsPlexName,
          regionName: cicsRegion.regionName,
        };

        const upToDateResource = await loadResourcesWithProgress(resourceTypes.meta, resourceName, resourceContext);
        if (upToDateResource) {
          await showInspectResource(context, upToDateResource, resourceContext);
        }
      }
    }
  }
}

async function loadResources(
  resourceTypes: IResourceMeta<IResource>[],
  resourceName: string,
  resourceContext: IResourceProfileNameInfo,
  parentResource?: Resource<IResource>
): Promise<IContainedResource<IResource>> {
  const resourceContainer = new ResourceContainer(resourceTypes, resourceContext, parentResource);
  resourceContainer.setCriteria([resourceName]);
  const resources = await resourceContainer.fetchNextPage();

  if (resources.length === 0) {
    const hrn = resourceTypes.map((type) => type.humanReadableNameSingular).join(" or ");
    const message = CICSMessages.CICSResourceNotFound.message
      .replace("%resource-type%", hrn)
      .replace("%resource-name%", resourceName)
      .replace("%region-name%", resourceContext.regionName);

    CICSLogger.error(message);
    window.showErrorMessage(message);
    return;
  }

  return resources[0];
}

function getResourceType(resourceName: string): IResourceMeta<IResource>[] {
  return getMetas().filter((value) => value.resourceName == resourceName);
}

export function getInspectableResourceTypes(): Map<string, IResourceMeta<IResource>[]> {
  const resourceTypeMap: Map<string, IResourceMeta<IResource>[]> = getMetas().reduce((acc, item) => {
    if ([ResourceTypes.CICSLocalFile, ResourceTypes.CICSRemoteFile].includes(item.resourceName as ResourceTypes)) {
      return acc;
    }
    if ([ResourceTypes.CICSTSQueue, ResourceTypes.CICSSharedTSQueue].includes(item.resourceName as ResourceTypes)) {
      return acc;
    }

    if (SupportedResourceTypes.includes(item.resourceName as ResourceTypes)) {
      const label = item.humanReadableNameSingular;
      acc.set(label, [item]);
    }
    return acc;
  }, new Map());

  resourceTypeMap.set(l10n.t("File"), [LocalFileMeta, RemoteFileMeta]);
  resourceTypeMap.set(l10n.t("TS Queue"), [TSQueueMeta, SharedTSQueueMeta]);

  return resourceTypeMap;
}

async function selectResourceType(): Promise<{ name: string; meta: IResourceMeta<IResource>[] }> {
  const resourceTypeMap = getInspectableResourceTypes();

  const choice = await getChoiceFromQuickPick(CICSMessages.CICSSelectResourceType.message, Array.from(resourceTypeMap.keys()).sort());

  if (choice) {
    return {
      name: choice.label,
      meta: resourceTypeMap.get(choice.label),
    };
  }

  return undefined;
}
async function selectResource(resourceNameSingular: string, maxNameLength?: number): Promise<string | undefined> {
  const options: InputBoxOptions = {
    prompt: CICSMessages.CICSEnterResourceName.message.replace("%resource-human-readable%", resourceNameSingular),

    validateInput: (value: string): string | undefined => {
      const maxLength = maxNameLength ?? constants.MAX_RESOURCE_NAME_LENGTH;
      const tooLongErrorMessage = CICSMessages.CICSInvalidResourceNameLength.message.replace("%length%", `${maxLength}`);

      return value.length > maxLength ? tooLongErrorMessage : undefined;
    },
  };

  return (await window.showInputBox(options)) || undefined;
}

async function getChoiceFromQuickPick(placeHolder: string, items: string[]): Promise<QuickPickItem | undefined> {
  const qpItems: QuickPickItem[] = items.map((item) => ({ label: item }));

  const quickPick = Gui.createQuickPick();
  quickPick.items = qpItems;
  quickPick.placeholder = placeHolder;
  quickPick.ignoreFocusOut = true;
  quickPick.show();
  const choice = await Gui.resolveQuickPick(quickPick);
  quickPick.hide();
  return choice;
}
