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

import { IResourceAction, IResourceExtender } from "@zowe/cics-for-zowe-explorer-api";
import { getBuiltInResourceActions } from "../resources/actions";

class SCICSResourceExtender implements IResourceExtender {
  private static _instance: SCICSResourceExtender;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  registeredActions: IResourceAction[];

  private constructor() {
    this.registeredActions = getBuiltInResourceActions();
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
