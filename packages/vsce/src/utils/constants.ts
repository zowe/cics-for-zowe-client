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

  PERSISTENT_STORAGE: {
    PROGRAM_FILTER: {
      ID: "zowe.cics.program.filter",
      DEFAULT: "NOT (PROGRAM=CEE* OR PROGRAM=DFH* OR PROGRAM=CJ* OR PROGRAM=EYU* OR PROGRAM=CSQ* OR PROGRAM=CEL* OR PROGRAM=IGZ*)",
    },
    TRANSACTION_FILTER: {
      ID: "zowe.cics.transaction.filter",
      DEFAULT: "NOT (program=DFH* OR program=EYU*)",
    },
    LOCAL_FILE_FILTER: {
      ID: "zowe.cics.localFile.filter",
      DEFAULT: "file=*",
    },
    TASK_FILTER: {
      ID: "zowe.cics.tasks.filter",
      DEFAULT: "TRANID=*",
    },
  }
};
