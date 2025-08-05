/**
 * instance program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies instance distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { commands, ExtensionContext } from "vscode";
import { inspectResourceCallBack } from "../commands/inspectResourceCommandUtils";
import { IResource } from "../doc";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { SessionHandler } from "../resources";
import { ProfileManagement } from "../utils/profileManagement";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { ResourceInspectorViewProvider } from "./ResourceInspectorViewProvider";

export async function executeAction(command: string, message: any, instance: ResourceInspectorViewProvider, context: ExtensionContext) {
  const resource = await instance.getResource();
  const resourceHandlerMap = await instance.getResourceHandlerMap();
  const profileName = resourceHandlerMap.filter((itm) => itm.key === "profile")[0].value;
  const profile = ProfileManagement.getProfilesCache().loadNamedProfile(profileName, "cics");

  const session = SessionHandler.getInstance().getSession(profile);
  const cicsplexName = resourceHandlerMap.filter((itm) => itm.key === "cicsplex")[0].value;
  const regionName = resourceHandlerMap.filter((itm) => itm.key === "region")[0].value;

  const node =
    instance.getNode() ??
    new CICSResourceContainerNode<IResource>(
      "Resource Inspector Node",
      {
        parentNode: null as any,
        session,
        profile,
        cicsplexName,
        regionName,
      },
      resource
    );

  if (command === "action") {
    const action = CICSResourceExtender.getAction(resource.meta.resourceName, message.actionId);
    if (!action) {
      return;
    }
    if (typeof action.action === "string") {
      await commands.executeCommand(action.action, node);
      await inspectResourceCallBack(context, resource.meta.getName(resource.resource), resource.meta.resourceName, resourceHandlerMap, node);
    } else {
      await action.action(resource.resource.attributes, {
        profile,
        session,
        cicsplexName,
        regionName,
      });
    }
  }
  if (command === "refresh") {
    await inspectResourceCallBack(context, resource.meta.getName(resource.resource), resource.meta.resourceName, resourceHandlerMap, node);
  }
}
