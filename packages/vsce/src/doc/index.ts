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

import { LibraryMeta } from "./LibraryMeta";
import { LocalFileMeta } from "./LocalFileMeta";
import { PipelineMeta } from "./PipelineMeta";
import { ProgramMeta } from "./ProgramMeta";
import { TaskMeta } from "./TaskMeta";
import { TCPIPMeta } from "./TCPIPMeta";
import { TransactionMeta } from "./TransactionMeta";
import { URIMapMeta } from "./URIMapMeta";

export const getMetas = () => {
  return [
    LocalFileMeta,
    PipelineMeta,
    ProgramMeta,
    TaskMeta,
    TCPIPMeta,
    TransactionMeta,
    URIMapMeta,
    LibraryMeta
  ];
};

export * from "./IResourceMeta";
export * from "./LocalFileMeta";
export * from "./PipelineMeta";
export * from "./ProgramMeta";
export * from "./TaskMeta";
export * from "./TCPIPMeta";
export * from "./TransactionMeta";
export * from "./URIMapMeta";
export * from "./LibraryMeta";
