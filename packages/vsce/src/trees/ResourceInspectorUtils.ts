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
import { ExtensionContext, ProgressLocation, commands, l10n, window } from "vscode";
import { showInspectResource } from "../commands/inspectResourceCommandUtils";
import { IContainedResource, getMetas } from "../doc";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { Resource, ResourceContainer } from "../resources";
import { IResourceInspectorProps, IResourceInspectorResource } from "../webviews/common/vscode";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "./ResourceInspectorViewProvider";

export async function executeAction(
  command: string,
  message: IResourceInspectorProps,
  instance: ResourceInspectorViewProvider,
  context: ExtensionContext
) {
  if (command === "action") {
    const action = CICSResourceExtender.getAction(message.actionId);
    if (!action) {
      return;
    }
    if (typeof action.action === "string") {
      for (const r of message.resources) {
        const node = new CICSResourceContainerNode<IResource>(
          "Resource Inspector Node",
          {
            parentNode: null as any,
            profile: r.context.profile,
            cicsplexName: r.context.cicsplexName,
            regionName: r.context.regionName,
          },
          { meta: getMetas().find((m) => m.resourceName === r.meta.resourceName), resource: new Resource(r.resource) }
        );

        await commands.executeCommand(action.action, node);
      }
      if (action.refreshResourceInspector) {
        await refreshWithProgress(message.resources);
      }
    } else {
      await action.action(message.resources[0].resource as ResourceTypeMap[keyof ResourceTypeMap], message.resources[0].context);
    }
  }
  if (command === "refresh") {
    await refreshWithProgress(message.resources);
  }

  async function refreshWithProgress(resources: IResourceInspectorResource[]) {
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});
        progress.report({
          message: l10n.t("Refreshing..."),
        });
        try {
          const updatedResources: {
            containedResource: IContainedResource<IResource>;
            cxt: IResourceContext;
          }[] = [];

          for (const r of resources) {
            const resourceContainer = new ResourceContainer([getMetas().find((m) => m.resourceName === r.meta.resourceName)], {
              profileName: r.context.profile.name,
              cicsplexName: r.context.cicsplexName,
              regionName: r.context.regionName,
            });

            resourceContainer.setCriteria([r.name]);
            const newResources = await resourceContainer.fetchNextPage();
            updatedResources.push(
              ...newResources.map((re) => {
                return { containedResource: re, cxt: r.context };
              })
            );
          }

          const resourcesToSendToRI: {
            containedResource: IContainedResource<IResource>;
            cxt: IResourceContext;
          }[] = [];

          for (const existingResource of instance.getResources()) {
            const newIdx = updatedResources.findIndex(
              (r) =>
                r.containedResource.meta.getName(r.containedResource.resource) === existingResource.name &&
                r.containedResource.meta.resourceName === existingResource.meta.resourceName &&
                r.cxt.profile.name === existingResource.context.profile.name &&
                r.cxt.cicsplexName === existingResource.context.cicsplexName &&
                r.cxt.regionName === existingResource.context.regionName
            );
            if (newIdx > -1) {
              resourcesToSendToRI.push(updatedResources[newIdx]);
            } else {
              resourcesToSendToRI.push({
                containedResource: {
                  meta: getMetas().find((m) => m.resourceName === existingResource.meta.resourceName),
                  resource: new Resource(existingResource.resource),
                },
                cxt: existingResource.context,
              });
            }
          }

          await showInspectResource(context, resourcesToSendToRI);
        } catch (error) {
          window.showErrorMessage(
            l10n.t(
              "Something went wrong while performing Refresh - {0}",
              JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " ")
            )
          );
        }
      }
    );
  }
}
