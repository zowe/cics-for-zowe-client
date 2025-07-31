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

import * as meta from "../../package.json";

export default {
  /**
   * Default maximum number of resources returned from a CMCI request
   */
  RESOURCES_MAX: 800,

  /**
   * Default maximum number of items stored in persistent storage
   */
  PERSISTENT_STORAGE_MAX_LENGTH: 10,

  /**
   * 100 percent for progress bars
   */
  PERCENTAGE_MAX: 100,

  /**
   * HTTP return code for OK
   */
  HTTP_OK: 200,

  /**
   * HTTP return code for Unauthorized
   */
  HTTP_ERROR_UNAUTHORIZED: 401,

  /**
   * HTTP return code for Not Found
   */
  HTTP_ERROR_NOT_FOUND: 404,

  /**
   * HTTP return code for Server Error
   */
  HTTP_ERROR_SERVER_ERROR: 500,

  /**
   * Default number of resources on each page, pulled from package.json
   */
  DEFAULT_RESOURCE_PAGE_SIZE: meta.contributes.configuration.properties["zowe.cics.resourcePageCount"].default,

  /**
   * Default resource filters pulled from package.json where configuration is specified
   */
  DEFAULT_CICSLIBRARY_FILTER: meta.contributes.configuration.properties["zowe.cics.library.filter"].default,
  DEFAULT_CICSLOCALFILE_FILTER: meta.contributes.configuration.properties["zowe.cics.localFile.filter"].default,
  DEFAULT_CICSLOCALTRANSACTION_FILTER: meta.contributes.configuration.properties["zowe.cics.transaction.filter"].default,
  DEFAULT_CICSPIPELINE_FILTER: meta.contributes.configuration.properties["zowe.cics.pipeline.filter"].default,
  DEFAULT_CICSPROGRAM_FILTER: meta.contributes.configuration.properties["zowe.cics.program.filter"].default,
  DEFAULT_CICSTCPIPSERVICE_FILTER: meta.contributes.configuration.properties["zowe.cics.tcpipService.filter"].default,
  DEFAULT_CICSTASK_FILTER: meta.contributes.configuration.properties["zowe.cics.tasks.filter"].default,
  DEFAULT_CICSURIMAP_FILTER: meta.contributes.configuration.properties["zowe.cics.uriMap.filter"].default,
  DEFAULT_CICSWEBSERVICE_FILTER: meta.contributes.configuration.properties["zowe.cics.webService.filter"].default,
  DEFAULT_CICSJVMSERVER_FILTER: meta.contributes.configuration.properties["zowe.cics.jvmServer.filter"].default,

  MAX_TRANS_RESOURCE_NAME_LENGTH: 4,
  MAX_RESOURCE_NAME_LENGTH: 8,
};
