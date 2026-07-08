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

import { ResourceAction, ResourceTypes, type ILibrary, type IResourceContext, type ResourceActionOptions } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSLibrary>[] = [
  {
    id: "CICS.CICSLibrary.ENABLE",
    name: l10n.t("Enable Library"),
    resourceType: ResourceTypes.CICSLibrary,
    visibleWhen: (library: ILibrary, _cx: IResourceContext) => library.enablestatus !== "ENABLED",
    action: "cics-extension-for-zowe.enableLibrary",
  },
  {
    id: "CICS.CICSLibrary.DISABLE",
    name: l10n.t("Disable Library"),
    resourceType: ResourceTypes.CICSLibrary,
    visibleWhen: (library: ILibrary, _cx: IResourceContext) => library.enablestatus !== "DISABLED",
    action: "cics-extension-for-zowe.disableLibrary",
  },
  {
    id: "CICS.CICSLibrary.COMPARE_TO",
    name: l10n.t("Compare to..."),
    resourceType: ResourceTypes.CICSLibrary,
    action: "cics-extension-for-zowe.compareTreeResourceTo",
    refreshResourceInspector: false,
  },
];

export function getLibraryActions(): ResourceAction<ResourceTypes.CICSLibrary>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSLibrary>(action));
}
