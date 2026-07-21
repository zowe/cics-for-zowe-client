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

import { ResourceTypes, type ResourceAction, type ResourceTypeMap } from "@zowe/cics-for-zowe-explorer-api";
import { getJVMEndpointActions } from "./JVMEndpointActions";
import { getJVMServerActions } from "./JVMServerActions";
import { getLibraryActions } from "./LibraryActions";
import { getLocalFileActions } from "./LocalFileActions";
import { getManagedRegionActions } from "./ManagedRegionActions";
import { getProgramActions } from "./ProgramActions";
import { getRegionActions } from "./RegionActions";
import { getSharedTSQueueActions, getTSQueueActions } from "./TSQueueActions";
import { getTaskActions } from "./TaskActions";
import { getTransactionActions } from "./TransactionActions";
import { getTCPIPActions } from "./TCPIPActions";
import { getURIMapActions } from "./URIMapsActions";

export function getBuiltInResourceActions(): Map<keyof ResourceTypeMap, ResourceAction<keyof ResourceTypeMap>[]> {
  const map = new Map<keyof ResourceTypeMap, ResourceAction<keyof ResourceTypeMap>[]>();
  map.set(ResourceTypes.CICSProgram, getProgramActions());
  map.set(ResourceTypes.CICSLocalTransaction, getTransactionActions());
  map.set(ResourceTypes.CICSLocalFile, getLocalFileActions());
  map.set(ResourceTypes.CICSLibrary, getLibraryActions());
  map.set(ResourceTypes.CICSJVMServer, getJVMServerActions());
  map.set(ResourceTypes.CICSJVMEndpoint, getJVMEndpointActions());
  map.set(ResourceTypes.CICSTSQueue, getTSQueueActions());
  map.set(ResourceTypes.CICSSharedTSQueue, getSharedTSQueueActions());
  map.set(ResourceTypes.CICSTask, getTaskActions());
  map.set(ResourceTypes.CICSManagedRegion, getManagedRegionActions());
  map.set(ResourceTypes.CICSRegion, getRegionActions());
  map.set(ResourceTypes.CICSTCPIPService, getTCPIPActions());
  map.set(ResourceTypes.CICSURIMap, getURIMapActions());

  return map;
}

export * from "./JVMEndpointActions";
export * from "./JVMServerActions";
export * from "./LibraryActions";
export * from "./LocalFileActions";
export * from "./ManagedRegionActions";
export * from "./ProgramActions";
export * from "./RegionActions";
export * from "./TSQueueActions";
export * from "./TaskActions";
export * from "./TransactionActions";
export * from "./TCPIPActions";
export * from "./URIMapsActions";
