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

import { IResource, IResourceContext, ResourceTypeMap } from "@zowe/cics-for-zowe-explorer-api";
import { Gui } from "@zowe/zowe-explorer-api";
import { ExtensionContext, ProgressLocation, commands, l10n, window } from "vscode";
import { showInspectResource } from "../commands/inspectResourceCommandUtils";
import { IContainedResource, getMetas } from "../doc";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { Resource, ResourceContainer } from "../resources";
import { IResourceInspectorResource } from "../webviews/common/vscode";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "./ResourceInspectorViewProvider";

type IResourceWithContext = {
  containedResource: IContainedResource<IResource>;
  ctx: IResourceContext;
};

export const handleActionCommand = async (
  actionId: string,
  resources: IResourceInspectorResource[],
  instance: ResourceInspectorViewProvider,
  context: ExtensionContext
) => {
  const action = CICSResourceExtender.getAction(actionId);
  if (!action) {
    return;
  }

  if (typeof action.action === "string") {
    await executeCommandAction(action.action, resources);
    if (action.refreshResourceInspector) {
      await handleRefreshCommand(resources, instance, context);
    }
  } else {
    const firstResource = resources[0];
    await action.action(firstResource.resource as ResourceTypeMap[keyof ResourceTypeMap], firstResource.context);
  }
};

const executeCommandAction = async (commandName: string, resources: IResourceInspectorResource[]) => {
  for (const resource of resources) {
    const node = createResourceNode(resource);
    await commands.executeCommand(commandName, node);
  }
};

const createResourceNode = (resource: IResourceInspectorResource): CICSResourceContainerNode<IResource> => {
  const meta = getMetas().find((m) => m.resourceName === resource.meta.resourceName);

  return new CICSResourceContainerNode<IResource>(
    "Resource Inspector Node",
    {
      parentNode: null as any,
      profile: resource.context.profile,
      cicsplexName: resource.context.cicsplexName,
      regionName: resource.context.regionName,
    },
    {
      meta,
      resource: new Resource(resource.resource),
    }
  );
};

export const handleRefreshCommand = async (
  resources: IResourceInspectorResource[],
  instance: ResourceInspectorViewProvider | null,
  context: ExtensionContext
) => {
  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      cancellable: false,
    },
    async (progress) => {
      progress.report({ message: l10n.t("Refreshing...") });

      const updatedResources = await fetchUpdatedResources(resources);

      if (updatedResources.length === 0) {
        return Gui.showMessage(l10n.t("Resource(s) {0} not found.", resources.map((r) => r.name).join(", ")));
      }

      const resourcesToDisplay = instance ? mergeWithExistingResources(instance.getResources(), updatedResources) : updatedResources;

      await showInspectResource(context, resourcesToDisplay);
    }
  );
};

const fetchUpdatedResources = async (resources: IResourceInspectorResource[]): Promise<IResourceWithContext[]> => {
  const updatedResources: IResourceWithContext[] = [];

  for (const resource of resources) {
    const meta = getMetas().find((m) => m.resourceName === resource.meta.resourceName);
    const resourceContainer = new ResourceContainer([meta], {
      profileName: resource.context.profile.name,
      cicsplexName: resource.context.cicsplexName,
      regionName: resource.context.regionName,
    });

    resourceContainer.setCriteria([resource.name]);
    const fetchedResources = await resourceContainer.fetchNextPage();

    updatedResources.push(
      ...fetchedResources.map((containedResource) => ({
        containedResource,
        ctx: resource.context,
      }))
    );
  }

  return updatedResources;
};

const mergeWithExistingResources = (
  existingResources: IResourceInspectorResource[],
  updatedResources: IResourceWithContext[]
): IResourceWithContext[] => {
  return existingResources.map((existingResource) => {
    const matchingResource = findMatchingResource(existingResource, updatedResources);
    return matchingResource ?? createFallbackResource(existingResource);
  });
};

const findMatchingResource = (
  existingResource: IResourceInspectorResource,
  updatedResources: IResourceWithContext[]
): IResourceWithContext | undefined => {
  return updatedResources.find((updated) => resourcesMatch(existingResource, updated));
};

const resourcesMatch = (existing: IResourceInspectorResource, updated: IResourceWithContext): boolean => {
  const updatedName = updated.containedResource.meta.getName(updated.containedResource.resource);

  return (
    updatedName === existing.name &&
    updated.containedResource.meta.resourceName === existing.meta.resourceName &&
    updated.ctx.profile.name === existing.context.profile.name &&
    updated.ctx.cicsplexName === existing.context.cicsplexName &&
    updated.ctx.regionName === existing.context.regionName
  );
};

const createFallbackResource = (existingResource: IResourceInspectorResource): IResourceWithContext => {
  const meta = getMetas().find((m) => m.resourceName === existingResource.meta.resourceName);

  return {
    containedResource: {
      meta,
      resource: new Resource(existingResource.resource),
    },
    ctx: existingResource.context,
  };
};

const showRefreshError = (error: unknown): void => {
  const errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " ");

  window.showErrorMessage(l10n.t("Something went wrong while performing Refresh - {0}", errorMessage));
};
