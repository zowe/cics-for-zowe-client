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

import { type ResourceAction, type ResourceTypeMap, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { getLocalFileActions } from "./LocalFileActions";
import { getProgramActions } from "./ProgramActions";
import { getSharedTSQueueActions, getTSQueueActions } from "./TSQueueActions";
import { getTransactionActions } from "./TransactionActions";
import { getManagedRegionActions } from "./ManagedRegionActions";
import { getRegionActions } from "./RegionActions";

export function getBuiltInResourceActions(): Map<keyof ResourceTypeMap, ResourceAction<keyof ResourceTypeMap>[]> {
  const map = new Map<keyof ResourceTypeMap, ResourceAction<keyof ResourceTypeMap>[]>();
  map.set(ResourceTypes.CICSProgram, getProgramActions());
  map.set(ResourceTypes.CICSLocalTransaction, getTransactionActions());
  map.set(ResourceTypes.CICSLocalFile, getLocalFileActions());
  map.set(ResourceTypes.CICSTSQueue, getTSQueueActions());
  map.set(ResourceTypes.CICSSharedTSQueue, getSharedTSQueueActions());
  map.set(ResourceTypes.CICSManagedRegion, getManagedRegionActions());
  map.set(ResourceTypes.CICSRegion, getRegionActions());

  return map;
}

export * from "./LocalFileActions";
export * from "./ProgramActions";
export * from "./TSQueueActions";
export * from "./TransactionActions";
export * from "./ManagedRegionActions";
export * from "./RegionActions";