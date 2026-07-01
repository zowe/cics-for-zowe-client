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

import { type IJVMEndpoint, type IResourceContext, ResourceAction, type ResourceActionOptions, ResourceTypes }
  from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSJVMEndpoint>[] = [
  {
    id: "CICS.CICSJVMEndpoint.ENABLE",
    name: l10n.t("Enable JVM Endpoint"),
    resourceType: ResourceTypes.CICSJVMEndpoint,
    visibleWhen: (jvmEndpoint: IJVMEndpoint, _cx: IResourceContext) => jvmEndpoint.enablestatus !== "ENABLED",
    action: "cics-extension-for-zowe.enableJVMEndpoint",
  },
  {
    id: "CICS.CICSJVMEndpoint.DISABLE",
    name: l10n.t("Disable JVM Endpoint"),
    resourceType: ResourceTypes.CICSJVMEndpoint,
    visibleWhen: (jvmEndpoint: IJVMEndpoint, _cx: IResourceContext) => jvmEndpoint.enablestatus !== "DISABLED",
    action: "cics-extension-for-zowe.disableJVMEndpoint",
  },
  {
    id: "CICS.CICSJVMEndpoint.COPY_NAME",
    name: l10n.t("Copy Name"),
    resourceType: ResourceTypes.CICSJVMEndpoint,
    action: "cics-extension-for-zowe.copyResourceName",
    refreshResourceInspector: false,
  },
];

export function getJVMEndpointActions(): ResourceAction<ResourceTypes.CICSJVMEndpoint>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSJVMEndpoint>(action));
}
