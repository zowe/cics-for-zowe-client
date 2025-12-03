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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceMeta } from "./IResourceMeta";
import { JVMServerMeta } from "./JVMServer.meta";
import { BundleMeta } from "./bundle.meta";
import { BundlePartMeta } from "./bundlePart.meta";
import { JVMEndpointMeta } from "./jvmEndpoints.meta";
import { LibraryMeta } from "./library.meta";
import { LibraryDatasetMeta } from "./libraryDataset.meta";
import { LocalFileMeta } from "./localFile.meta";
import { PipelineMeta } from "./pipeline.meta";
import { ProgramMeta } from "./program.meta";
import { RemoteFileMeta } from "./remoteFile.meta";
import { SharedTSQueueMeta } from "./sharedTSqueue.meta";
import { TaskMeta } from "./task.meta";
import { TCPIPMeta } from "./tcpip.meta";
import { TransactionMeta } from "./transaction.meta";
import { TSQueueMeta } from "./tsqueue.meta";
import { URIMapMeta } from "./urimap.meta";
import { WebServiceMeta } from "./webservice.meta";

export * from "./IResourceMeta";
export * from "./JVMServer.meta";
export * from "./bundle.meta";
export * from "./bundlePart.meta";
export * from "./jvmEndpoints.meta";
export * from "./library.meta";
export * from "./libraryDataset.meta";
export * from "./localFile.meta";
export * from "./pipeline.meta";
export * from "./program.meta";
export * from "./remoteFile.meta";
export * from "./sharedTSqueue.meta";
export * from "./task.meta";
export * from "./tcpip.meta";
export * from "./transaction.meta";
export * from "./tsqueue.meta";
export * from "./urimap.meta";
export * from "./webservice.meta";

export function getMetas(): IResourceMeta<IResource>[] {
  return [
    BundleMeta,
    BundlePartMeta,
    LibraryMeta,
    LibraryDatasetMeta,
    LocalFileMeta,
    PipelineMeta,
    ProgramMeta,
    RemoteFileMeta,
    TaskMeta,
    TCPIPMeta,
    TransactionMeta,
    URIMapMeta,
    WebServiceMeta,
    JVMServerMeta,
    JVMEndpointMeta,
    TSQueueMeta,
    SharedTSQueueMeta,
  ];
}
