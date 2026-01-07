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

import { IResource, ResourceTypeMap } from "@zowe/cics-for-zowe-explorer-api";
import { ExtensionContext, ProgressLocation, commands, l10n, window } from "vscode";
// import { inspectResourceCallBack } from "../commands/inspectResourceCommandUtils";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { findResourceNodeInTree } from "../utils/treeUtils";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "./ResourceInspectorViewProvider";
import { IResourceInspectorProps } from "../webviews/common/vscode";
import { Resource } from "../resources";
import { getMetas } from "../doc";

export async function executeAction(
  command: string,
  message: IResourceInspectorProps,
  instance: ResourceInspectorViewProvider,
  context: ExtensionContext
) {
  // const resources = instance.getResources();
  // const resourceContext = instance.getResourceContext();

  const containedResource = { meta: getMetas().find((m) => m.resourceName === message.resources[0].meta.resourceName), resource: new Resource(message.resources[0].resource) };
  // let node = instance.getNode() ?? findResourceNodeInTree(instance.cicsTree, resourceContext, containedResource);
  // if (!node) {
  let node = new CICSResourceContainerNode<IResource>(
    "Resource Inspector Node",
    {
      parentNode: null as any,
      profile: message.resourceContext.profile,
      cicsplexName: message.resourceContext.cicsplexName,
      regionName: message.resourceContext.regionName,
    },
    containedResource,
  );
  // }

  if (command === "action") {
    const action = CICSResourceExtender.getAction(message.actionId);
    if (!action) {
      return;
    }
    if (typeof action.action === "string") {
      await commands.executeCommand(action.action, node);
      if (action.refreshResourceInspector) {
        // await refreshWithProgress();
        // Refetch resources - could be 1, 2, or more! Set them in the provider and send to view?
      }
    } else {
      await action.action(message.resources[0].resource as ResourceTypeMap[keyof ResourceTypeMap], message.resourceContext);
    }
  }
  if (command === "refresh") {
    // await refreshWithProgress();
    // Refetch resources - could be 1, 2, or more! Set them in the provider and send to view?
  }

  // async function refreshWithProgress() {
  //   await window.withProgress(
  //     {
  //       location: ProgressLocation.Notification,
  //       cancellable: false,
  //     },
  //     async (progress, token) => {
  //       token.onCancellationRequested(() => { });
  //       progress.report({
  //         message: l10n.t("Refreshing {0} {1}", resources[0].meta.humanReadableNameSingular, resources[0].meta.getName(new Resource(resources[0].resource))),
  //       });
  //       try {
  //         // await inspectResourceCallBack(
  //         //   context,
  //         //   resources[0],
  //         //   { profileName: resourceContext.profile.name, cicsplexName: resourceContext.cicsplexName, regionName: resourceContext.regionName },
  //         //   instance.getNode()
  //         // );
  //       } catch (error) {
  //         window.showErrorMessage(
  //           l10n.t(
  //             "Something went wrong while performing Refresh - {0}",
  //             JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " ")
  //           )
  //         );
  //       }
  //     }
  //   );
  // }
}
