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

import { type IJVMServer, type IResourceContext, ResourceAction, type ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSJVMServer>[] = [
  {
    id: "CICS.CICSJVMServer.ENABLE",
    name: l10n.t("Enable JVM Server"),
    resourceType: ResourceTypes.CICSJVMServer,
    visibleWhen: (jvmServer: IJVMServer, _cx: IResourceContext) => jvmServer.enablestatus !== "ENABLED",
    action: "cics-extension-for-zowe.enableJVMServer",
  },
  {
    id: "CICS.CICSJVMServer.DISABLE",
    name: l10n.t("Disable JVM Server"),
    resourceType: ResourceTypes.CICSJVMServer,
    visibleWhen: (jvmServer: IJVMServer, _cx: IResourceContext) => jvmServer.enablestatus !== "DISABLED",
    action: "cics-extension-for-zowe.disableJVMServer",
  },
  {
    id: "CICS.CICSJVMServer.COPY_NAME",
    name: l10n.t("Copy Name"),
    resourceType: ResourceTypes.CICSJVMServer,
    action: "cics-extension-for-zowe.copyResourceName",
    refreshResourceInspector: false,
  },
];

export function getJVMServerActions(): ResourceAction<ResourceTypes.CICSJVMServer>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSJVMServer>(action));
}
