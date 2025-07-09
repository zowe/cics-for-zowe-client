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
import { IResource, IResourceMeta } from "../doc";
import { SupportedResources } from "../model";
import { CICSSession, Resource, ResourceContainer } from "../resources";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { CICSLogger } from "../utils/CICSLogger";
import { IFocusRegion } from "../doc/commands/IFocusRegion";
import { getFocusRegion } from "./setFocusRegionCommand";
import { IResourcesHandler } from "../doc/resources/IResourcesHandler";
import { Gui } from "@zowe/zowe-explorer-api";

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
  await showInspectResource(context, resourcesHandler);
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

    showInspectResource(context, resourcesHandler);
  }
}

export async function inspectResource(context: ExtensionContext) {
  const focusRegion: IFocusRegion = await getFocusRegion();

  if (focusRegion) {
    const resourceType = await selectResourceType();
    if (resourceType) {
      const resourceName = await selectResource();

      if (resourceName) {
        const resourcesHandler: IResourcesHandler = await loadResources(
          focusRegion.session,
          resourceType,
          resourceName,
          focusRegion.focusSelectedRegion,
          focusRegion.cicsPlexName,
          focusRegion.profile.name
        );

        showInspectResource(context, resourcesHandler);
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
  if (resourceName) {
    resourceContainer.setCriteria([resourceName]);
  }
  resourceContainer.setProfileName(profileName);
  const resources: [Resource<IResource>[], boolean] = await resourceContainer.loadResources(session, regionName, cicsplex);

  return { resources, resourceContainer };
}

function getResourceType(resourceName: string): IResourceMeta<IResource> {
  const types: IResourceMeta<IResource>[] = SupportedResources.metaResources.filter((value) => value.resourceName == resourceName);

  // Should only have one
  if (types?.length > 0) {
    return types[0];
  }
  return undefined;
}

async function selectResourceType(): Promise<IResourceMeta<IResource> | undefined> {
  const choice = await getChoiceFromQuickPick("Select Resource Type...", SupportedResources.resources);

  if (choice) {
    return getResourceType(choice.label);
  }

  return undefined;
}

async function selectResource(): Promise<string | undefined> {
  return getEntryFromInputBox();
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

async function getEntryFromInputBox(): Promise<string | undefined> {
  const options: InputBoxOptions = {
    prompt: "Enter resource name",
    value: ""
  };

  if (!options.validateInput) {
    options.validateInput = (value) => undefined;
  }
  return (await window.showInputBox(options)) || undefined;
}
