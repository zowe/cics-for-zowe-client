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

import { IResourceAction, IResourceContext, IResourceExtender, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { programNewcopy } from "@zowe/cics-for-zowe-sdk";
import { openLocalFile } from "../commands/openLocalFileCommand";
import { ILocalFile, IProgram } from "../doc";
import path = require("path");


const builtIns: IResourceAction[] = [

  {
    id: "CICS.CICSProgram.NEWCOPY",
    name: "New Copy Program",
    resourceType: ResourceTypes.CICSProgram,
    iconPath: path.join(__dirname, "..", "resources", "imgs", "newcopy-dark.svg"),
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
    iconPath: path.join(__dirname, "..", "resources", "imgs", "plus-dark.svg"),
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


class SCICSResourceExtender implements IResourceExtender {
  private static _instance: SCICSResourceExtender;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  registeredActions: IResourceAction[];

  private constructor() {
    this.registeredActions = builtIns;
  }

  registerAction(action: IResourceAction) {
    this.registeredActions.push(action);
  }
  deregisterAction(id: string) {
    this.registeredActions = this.registeredActions.filter((action) => action.id.toUpperCase() !== id.toUpperCase());
  }
  getActions() {
    return this.registeredActions;
  }
  getAction(id: string) {
    return this.registeredActions.filter((action) => action.id.toUpperCase() === id.toUpperCase())[0] ?? undefined;
  }
  getActionsForResourceType(resType: string[]): IResourceAction[] {
    return this.registeredActions.filter((action) => resType.includes(action.resourceType));
  }
}

const CICSResourceExtender = SCICSResourceExtender.Instance;
export default CICSResourceExtender;
