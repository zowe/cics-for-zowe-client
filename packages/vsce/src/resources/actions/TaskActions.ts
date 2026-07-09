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

import { ResourceAction, ResourceTypes, type ResourceActionOptions } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSTask>[] = [
  {
    id: "CICS.CICSTask.PURGE",
    name: l10n.t("Purge Task"),
    resourceType: ResourceTypes.CICSTask,
    action: "cics-extension-for-zowe.purgeTask",
    refreshResourceInspector: false,
  },
  {
    id: "CICS.CICSTask.INQUIRE_TRANSACTION",
    name: l10n.t("Inquire Transaction"),
    resourceType: ResourceTypes.CICSTask,
    action: "cics-extension-for-zowe.inquireTransaction",
    refreshResourceInspector: false,
  },
  {
    id: "CICS.CICSTask.COMPARE_TO",
    name: l10n.t("Compare to..."),
    resourceType: ResourceTypes.CICSTask,
    action: "cics-extension-for-zowe.compareTreeResourceTo",
    refreshResourceInspector: false,
  },
];

export function getTaskActions(): ResourceAction<ResourceTypes.CICSTask>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSTask>(action));
}
