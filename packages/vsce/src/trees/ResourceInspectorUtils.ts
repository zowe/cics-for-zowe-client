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

import { commands, ExtensionContext, window, ProgressLocation } from "vscode";
import { inspectResourceCallBack } from "../commands/inspectResourceCommandUtils";
import { IResource, ResourceTypeMap } from "@zowe/cics-for-zowe-explorer-api";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "./ResourceInspectorViewProvider";
import { TransformWebviewMessage } from "../webviews/common/vscode";

export async function executeAction(
  command: string,
  message: TransformWebviewMessage,
  instance: ResourceInspectorViewProvider,
  context: ExtensionContext
) {
  const resource = instance.getResource();
  const resourceContext = instance.getResourceContext();

  const node =
    instance.getNode() ??
    new CICSResourceContainerNode<IResource>(
      "Resource Inspector Node",
      {
        parentNode: null as any,
        profile: resourceContext.profile,
        cicsplexName: resourceContext.cicsplexName,
        regionName: resourceContext.regionName,
      },
      resource
    );

  if (command === "action") {
    const action = CICSResourceExtender.getAction(message.actionId);
    if (!action) {
      return;
    }
    if (typeof action.action === "string") {
      await commands.executeCommand(action.action, node);
      await refreshWithProgress();
    } else {
      await action.action(resource.resource.attributes as ResourceTypeMap[keyof ResourceTypeMap], resourceContext);
    }
  }
  if (command === "refresh") {
    await refreshWithProgress();
  }

  async function refreshWithProgress() {
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});
        progress.report({
          message: ` Refreshing ` + resource.meta.humanReadableNameSingular + ` ` + resource.meta.getName(resource.resource),
        });
        try {
          await inspectResourceCallBack(
            context,
            resource,
            { profileName: resourceContext.profile.name, cicsplexName: resourceContext.cicsplexName, regionName: resourceContext.regionName },
            instance.getNode()
          );
        } catch (error) {
          window.showErrorMessage(
            `Something went wrong while performing Refresh - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
              /(\\n\t|\\n|\\t)/gm,
              " "
            )}`
          );
        }
      }
    );
  }
}
