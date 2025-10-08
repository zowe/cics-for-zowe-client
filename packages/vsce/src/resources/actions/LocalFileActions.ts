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

import { ILocalFile, IResourceAction, IResourceContext, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

export function getLocalFileActions(): IResourceAction[] {
  return [
    {
      id: "CICS.CICSLocalFile.OPEN",
      name: "Open Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "OPEN",
      action: "cics-extension-for-zowe.openLocalFile",
    },
    {
      id: "CICS.CICSLocalFile.CLOSE",
      name: "Close Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "CLOSED",
      action: "cics-extension-for-zowe.closeLocalFile",
    },
    {
      id: "CICS.CICSLocalFile.ENABLE",
      name: "Enable Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.enablestatus !== "ENABLED",
      action: "cics-extension-for-zowe.enableLocalFile",
    },
    {
      id: "CICS.CICSLocalFile.DISABLE",
      name: "Disable Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.enablestatus !== "DISABLED",
      action: "cics-extension-for-zowe.disableLocalFile",
    },
  ];
}