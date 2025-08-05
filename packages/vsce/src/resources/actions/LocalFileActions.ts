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

import { IResourceContext, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { ILocalFile, IResourceActionWithIcon } from "../../doc";
import IconBuilder from "../../utils/IconBuilder";

export function getLocalFileActions(): IResourceActionWithIcon[] {
  return [
    {
      id: "CICS.CICSLocalFile.OPEN",
      name: "Open Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("plus").dark,
        light: IconBuilder.getIconFilePathFromName("plus").light,
      },
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "OPEN",
      action: "cics-extension-for-zowe.openLocalFile",
    },
    {
      id: "CICS.CICSLocalFile.CLOSE",
      name: "Close Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "CLOSE",
      action: "cics-extension-for-zowe.closeLocalFile",
    },
    {
      id: "CICS.CICSLocalFile.ENABLE",
      name: "Enable Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("plus").dark,
        light: IconBuilder.getIconFilePathFromName("plus").light,
      },
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "ENABLED",
      action: "cics-extension-for-zowe.enableLocalFile",
    },
    {
      id: "CICS.CICSLocalFile.DISABLE",
      name: "Disable Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "DISABLED",
      action: "cics-extension-for-zowe.disableLocalFile",
    },
  ];
}
