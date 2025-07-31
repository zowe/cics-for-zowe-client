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

import { IResource } from "../resources";
import { BundleMeta } from "./bundle.meta";
import { BundlePartMeta } from "./bundlePart.meta";
import { IResourceMeta } from "./IResourceMeta";
import { LibraryMeta } from "./library.meta";
import { LibraryDatasetMeta } from "./libraryDataset.meta";
import { LocalFileMeta } from "./localFile.meta";
import { PipelineMeta } from "./pipeline.meta";
import { ProgramMeta } from "./program.meta";
import { TaskMeta } from "./task.meta";
import { TCPIPMeta } from "./tcpip.meta";
import { TransactionMeta } from "./transaction.meta";
import { URIMapMeta } from "./urimap.meta";
import { WebServiceMeta } from "./webservice.meta";
import { JVMServerMeta } from "./JVMServer.meta";

export * from "./IResourceMeta";
export * from "./bundle.meta";
export * from "./bundlePart.meta";
export * from "./library.meta";
export * from "./libraryDataset.meta";
export * from "./localFile.meta";
export * from "./pipeline.meta";
export * from "./program.meta";
export * from "./task.meta";
export * from "./tcpip.meta";
export * from "./transaction.meta";
export * from "./urimap.meta";
export * from "./webservice.meta";
export * from "./JVMServer.meta";

export function getMetas(): IResourceMeta<IResource>[] {
  return [
    BundleMeta,
    BundlePartMeta,
    LibraryMeta,
    LibraryDatasetMeta,
    LocalFileMeta,
    PipelineMeta,
    ProgramMeta,
    TaskMeta,
    TCPIPMeta,
    TransactionMeta,
    URIMapMeta,
    WebServiceMeta,
    JVMServerMeta
  ];
}
