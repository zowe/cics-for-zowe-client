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

import { type IRegion, type IResourceContext, ResourceAction, type ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSRegion>[] = [
  {
    id: "CICS.CICSRegion.SHOWSITPARAMETERS",
    name: l10n.t("Show SIT Parameters"),
    resourceType: ResourceTypes.CICSRegion,
    visibleWhen: (region: IRegion, _cx: IResourceContext) => region.cicsstatus !== "INACTIVE",
    action: "cics-extension-for-zowe.showRegionParameters",
    refreshResourceInspector: false,
  },
  {
    id: "CICS.CICSRegion.SHOWREGIONLOGS",
    name: l10n.t("Show Region Logs"),
    resourceType: ResourceTypes.CICSRegion,
    visibleWhen: (region: IRegion, _cx: IResourceContext) => region.cicsstatus !== "INACTIVE",
    action: "cics-extension-for-zowe.showRegionLogs",
    refreshResourceInspector: false,
  },
];

export function getRegionActions(): ResourceAction<ResourceTypes.CICSRegion>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSRegion>(action));
}
