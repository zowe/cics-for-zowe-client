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

import { ResourceAction, ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const TSActions: ResourceActionOptions<ResourceTypes.CICSTSQueue>[] = [
  {
    id: "CICS.CICSTSQueue.DELETE",
    name: l10n.t("Delete"),
    resourceType: ResourceTypes.CICSTSQueue,
    action: "cics-extension-for-zowe.deleteTSQueue",
    refreshResourceInspector: false,
  },
];
const sharedTSActions: ResourceActionOptions<ResourceTypes.CICSSharedTSQueue>[] = [
  {
    id: "CICS.CICSSharedTSQueue.DELETE",
    name: l10n.t("Delete"),
    resourceType: ResourceTypes.CICSSharedTSQueue,
    action: "cics-extension-for-zowe.deleteTSQueue",
    refreshResourceInspector: false,
  },
];

export function getTSQueueActions(): ResourceAction<ResourceTypes.CICSTSQueue>[] {
  return TSActions.map((action) => new ResourceAction<ResourceTypes.CICSTSQueue>(action));
}
export function getSharedTSQueueActions(): ResourceAction<ResourceTypes.CICSSharedTSQueue>[] {
  return sharedTSActions.map((action) => new ResourceAction<ResourceTypes.CICSSharedTSQueue>(action));
}
