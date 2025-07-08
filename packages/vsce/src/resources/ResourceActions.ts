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
import { programNewcopy } from "@zowe/cics-for-zowe-sdk";
import { openLocalFile } from "../commands/openLocalFileCommand";
import { IProgram, ILocalFile, IResourceActionWithIcon } from "../doc";
import IconBuilder from "../utils/IconBuilder";

export function getBuiltInResourceActions(): IResourceActionWithIcon[] {

  return [

    {
      id: "CICS.CICSProgram.NEWCOPY",
      name: "New Copy Program",
      resourceType: ResourceTypes.CICSProgram,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("newcopy").dark,
        light: IconBuilder.getIconFilePathFromName("newcopy").light,
      },
      action: async (resource: IProgram, resourceContext: IResourceContext) => {
        await programNewcopy(resourceContext.session, {
          name: resource.program,
          regionName: resourceContext.regionName,
          cicsPlex: resourceContext.cicsplexName,
        });
      },
    },

    {
      id: "CICS.CICSLocalFile.OPEN",
      name: "Open Local File",
      resourceType: ResourceTypes.CICSLocalFile,
      iconPath: {
        dark: IconBuilder.getIconFilePathFromName("plus").dark,
        light: IconBuilder.getIconFilePathFromName("plus").light,
      },
      visibleWhen: (localFile: ILocalFile, _cx: IResourceContext) => localFile.openstatus !== "OPEN",
      action: async (resource: ILocalFile, resourceContext: IResourceContext) => {
        await openLocalFile(resourceContext.session, {
          name: resource.file,
          regionName: resourceContext.regionName,
          cicsPlex: resourceContext.cicsplexName,
        });
      },
    },

  ];
}
