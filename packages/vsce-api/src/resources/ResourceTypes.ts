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

export enum ResourceTypes {
  CICSLocalFile = "CICSLocalFile",
  CICSLocalTransaction = "CICSLocalTransaction",
  CICSProgram = "CICSProgram",
  CICSTCPIPService = "CICSTCPIPService",
  CICSLibrary = "CICSLibrary",
  CICSURIMap = "CICSURIMap",
  CICSTask = "CICSTask",
  CICSPipeline = "CICSPipeline",
  CICSWebService = "CICSWebService",
  CICS_JVMSERVER_RESOURCE = "CICS_JVMServer_RESOURCE",
}

export const SupportedResourceTypes: ResourceTypes[] = Object.values(ResourceTypes);
