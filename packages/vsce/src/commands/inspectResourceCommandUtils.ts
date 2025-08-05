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

import { commands, ExtensionContext, window } from "vscode";
import { CICSMessages } from "../constants/CICS.messages";
import { getMetas, IResource, IResourceMeta } from "../doc";
import { Resource, ResourceContainer } from "../resources";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSLogger } from "../utils/CICSLogger";
import { IFocusRegion } from "../doc/commands/IFocusRegion";
import { getFocusRegion } from "./setFocusRegionCommand";
import { IResourcesHandler } from "../doc/resources/IResourcesHandler";
import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { SessionHandler } from "../resources/SessionHandler";
import { ProfileManagement } from "../utils/profileManagement";

async function showInspectResource(context: ExtensionContext, resourcesHandler: IResourcesHandler, node: CICSResourceContainerNode<IResource>) {
  // Will only have one resource
  const resource: Resource<IResource>[] = resourcesHandler.resources[0];

  // Makes the "CICS Resource Inspector" tab visible in the panel
  commands.executeCommand("setContext", "cics-extension-for-zowe.showResourceInspector", true);
  // Focuses on the tab in the panel - previous command not working for me??
  commands.executeCommand("resource-inspector.focus");

  await ResourceInspectorViewProvider.getInstance(context).setResourceHandlerMap(resourcesHandler).setNode(node).setResource({
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
  await showInspectResource(context, resourcesHandler, node);
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
      focusRegion.cicsPlex,
      focusRegion.profile.name
    );

    showInspectResource(context, resourcesHandler, null);
  }
}

export async function inspectResourceCallBack(
  context: ExtensionContext,
  resourceName: string,
  resourceType: string,
  resourceHandlerMap: any[],
  node: CICSResourceContainerNode<IResource>
) {
  // Inspecting a resource by its name so this will be on the focus region
  const profileValue = resourceHandlerMap.find((item) => item.key === "profile")?.value;
  const regionValue = resourceHandlerMap.find((item) => item.key === "region")?.value;
  const cicsplex = resourceHandlerMap.find((item) => item.key === "cicsplex")?.value;
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileValue);
  const session = SessionHandler.getInstance().getSession(profile);

  const resourcesHandler: IResourcesHandler = await loadResources(
    session,
    getResourceType(resourceType),
    resourceName,
    regionValue,
    cicsplex,
    profileValue
  );

  showInspectResource(context, resourcesHandler, node);
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
