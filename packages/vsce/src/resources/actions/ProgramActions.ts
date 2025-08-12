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

import { IResourceAction, IResourceContext, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { IProgram } from "../../doc";

export function getProgramActions(): IResourceAction[] {
  return [
    {
      id: "CICS.CICSProgram.NEWCOPY",
      name: "New Copy",
      resourceType: ResourceTypes.CICSProgram,
      action: "cics-extension-for-zowe.newCopyProgram",
    },
    {
      id: "CICS.CICSProgram.PHASEIN",
      name: "Phase In",
      resourceType: ResourceTypes.CICSProgram,
      action: "cics-extension-for-zowe.phaseInCommand",
    },
    {
      id: "CICS.CICSProgram.DISABLE",
      name: "Disable",
      resourceType: ResourceTypes.CICSProgram,
      visibleWhen: (program: IProgram, _cx: IResourceContext) => program.enablestatus !== "DISABLED",
      action: "cics-extension-for-zowe.disableProgram",
    },
    {
      id: "CICS.CICSProgram.ENABLE",
      name: "Enable",
      resourceType: ResourceTypes.CICSProgram,
      visibleWhen: (program: IProgram, _cx: IResourceContext) => program.enablestatus !== "ENABLED",
      action: "cics-extension-for-zowe.enableProgram",
    },
    {
      id: "CICS.CICSProgram.SHOWLIBRARY",
      name: "Show Library",
      resourceType: ResourceTypes.CICSProgram,
      action: "cics-extension-for-zowe.showLibrary",
    },
  ];
}