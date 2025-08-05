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
import { IProgram, IResourceActionWithIcon } from "../../doc";
import IconBuilder from "../../utils/IconBuilder";

export function getProgramActions(): IResourceActionWithIcon[] {
  return [
    {
      id: "CICS.CICSProgram.NEWCOPY",
      name: "New Copy",
      resourceType: ResourceTypes.CICSProgram,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      action: "cics-extension-for-zowe.newCopyProgram",
    },
    {
      id: "CICS.CICSProgram.PHASEIN",
      name: "Phase In",
      resourceType: ResourceTypes.CICSProgram,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      action: "cics-extension-for-zowe.phaseInCommand",
    },
    {
      id: "CICS.CICSProgram.DISABLE",
      name: "Disable",
      resourceType: ResourceTypes.CICSProgram,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      visibleWhen: (program: IProgram, _cx: IResourceContext) => program.enablestatus !== "DISABLED",
      action: "cics-extension-for-zowe.disableProgram",
    },
    {
      id: "CICS.CICSProgram.ENABLE",
      name: "Enable",
      resourceType: ResourceTypes.CICSProgram,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      visibleWhen: (program: IProgram, _cx: IResourceContext) => program.enablestatus !== "ENABLED",
      action: "cics-extension-for-zowe.enableProgram",
    },
    {
      id: "CICS.CICSProgram.SHOWLIBRARY",
      name: "Show Library",
      resourceType: ResourceTypes.CICSProgram,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      action: "cics-extension-for-zowe.showLibrary",
    },
  ];
}
