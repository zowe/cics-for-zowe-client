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

import { commands, ExtensionContext } from "vscode";

import { inspectResourceByName, inspectResource } from "./inspectResourceCommandUtils";

import { InspectResourceEvent } from "../events/InspectResourceEvent";
import { IResourceInspectEvent, EventSourceTypes, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

export const inspectResourceEvent: InspectResourceEvent = InspectResourceEvent.getInstance();

export function getInspectResourceCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.inspectResource", async (resourceName?: string, resourceType?: string) => {
    if (resourceName && resourceType) {
      await inspectResourceByName(context, resourceName, resourceType);

      inspectResourceEvent.fire({ resourceType: resourceType as keyof typeof ResourceTypes, source: EventSourceTypes.OTHER} as IResourceInspectEvent);
    } else {
      await inspectResource(context);

      inspectResourceEvent.fire({ resourceType: resourceType as keyof typeof ResourceTypes, source: EventSourceTypes.PALETTE} as IResourceInspectEvent);
    }
  });
}
