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

import { IResourceExtender, ResourceAction, ResourceTypeMap } from "@zowe/cics-for-zowe-explorer-api";
import { getBuiltInResourceActions } from "../resources/actions";

class SCICSResourceExtender implements IResourceExtender {
  private static _instance: SCICSResourceExtender;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  registeredActions: Map<keyof ResourceTypeMap, ResourceAction<keyof ResourceTypeMap>[]>;

  private constructor() {
    this.registeredActions = getBuiltInResourceActions();
  }

  registerAction<TType extends keyof ResourceTypeMap>(action: ResourceAction<TType>) {
    const arr = this.registeredActions.get(action.resourceType) || [];
    arr.push(action);
    this.registeredActions.set(action.resourceType, arr);
  }
  getActions() {
    return [...this.registeredActions.values()].flat();
  }
  getAction(id: string) {
    const actions = this.getActions().filter((ac: ResourceAction<keyof ResourceTypeMap>) => ac.id === id);
    if (actions.length > 0) {
      return actions[0];
    }
    return undefined;
  }
  getActionsFor<TType extends keyof ResourceTypeMap>(type: TType): ResourceAction<TType>[] {
    return (this.registeredActions.get(type) || []) as ResourceAction<TType>[];
  }
}

const CICSResourceExtender = SCICSResourceExtender.Instance;
export default CICSResourceExtender;
