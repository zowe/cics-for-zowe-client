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

import { ResourceAction, ResourceTypes, type IBundle, type IResourceContext, type ResourceActionOptions } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSBundle>[] = [
  {
    id: "CICS.CICSBundle.ENABLE",
    name: l10n.t("Enable Bundle"),
    resourceType: ResourceTypes.CICSBundle,
    visibleWhen: (bundle: IBundle, _cx: IResourceContext) => bundle.enablestatus !== "ENABLED",
    action: "cics-extension-for-zowe.enableBundle",
  },
  {
    id: "CICS.CICSBundle.DISABLE",
    name: l10n.t("Disable Bundle"),
    resourceType: ResourceTypes.CICSBundle,
    visibleWhen: (bundle: IBundle, _cx: IResourceContext) => bundle.enablestatus !== "DISABLED",
    action: "cics-extension-for-zowe.disableBundle",
  },
  {
    id: "CICS.CICSBundle.COMPARE_TO",
    name: l10n.t("Compare to..."),
    resourceType: ResourceTypes.CICSBundle,
    action: "cics-extension-for-zowe.compareTreeResourceTo",
    refreshResourceInspector: false,
  },
  {
    id: "CICS.CICSBundle.COPY_NAME",
    name: l10n.t("Copy Name"),
    resourceType: ResourceTypes.CICSBundle,
    action: "cics-extension-for-zowe.copyResourceName",
    refreshResourceInspector: false,
  },
];

export function getBundleActions(): ResourceAction<ResourceTypes.CICSBundle>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSBundle>(action));
}
