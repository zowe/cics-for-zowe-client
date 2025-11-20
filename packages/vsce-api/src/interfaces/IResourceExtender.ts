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

import { ResourceAction, ResourceTypeMap } from "./ResourceAction";

export interface IResourceExtender {
  registeredActions: Map<keyof ResourceTypeMap, ResourceAction<keyof ResourceTypeMap>[]>;

  registerAction<TType extends keyof ResourceTypeMap>(action: ResourceAction<TType>): void;
  getActions(): ResourceAction<keyof ResourceTypeMap>[];
  getAction: (id: string) => ResourceAction<keyof ResourceTypeMap> | undefined;
  getActionsFor<TType extends keyof ResourceTypeMap>(type: TType): ResourceAction<TType>[];
}
