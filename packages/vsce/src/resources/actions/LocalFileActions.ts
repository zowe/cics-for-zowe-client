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

import { type ILocalFile, type IResourceContext, ResourceAction, type ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSLocalFile>[] = [
  {
    id: "CICS.CICSLocalFile.OPEN",
    name: l10n.t("Open Local File"),
    resourceType: ResourceTypes.CICSLocalFile,
    visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "OPEN",
    action: "cics-extension-for-zowe.openLocalFile",
  },
  {
    id: "CICS.CICSLocalFile.CLOSE",
    name: l10n.t("Close Local File"),
    resourceType: ResourceTypes.CICSLocalFile,
    visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "CLOSED",
    action: "cics-extension-for-zowe.closeLocalFile",
  },
  {
    id: "CICS.CICSLocalFile.ENABLE",
    name: l10n.t("Enable Local File"),
    resourceType: ResourceTypes.CICSLocalFile,
    visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.enablestatus !== "ENABLED",
    action: "cics-extension-for-zowe.enableLocalFile",
  },
  {
    id: "CICS.CICSLocalFile.DISABLE",
    name: l10n.t("Disable Local File"),
    resourceType: ResourceTypes.CICSLocalFile,
    visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.enablestatus !== "DISABLED",
    action: "cics-extension-for-zowe.disableLocalFile",
  },
];

export function getLocalFileActions(): ResourceAction<ResourceTypes.CICSLocalFile>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSLocalFile>(action));
}
