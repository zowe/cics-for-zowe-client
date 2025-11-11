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

export interface ICICSExtensionError {
  /*
   * Error message to display in the error notification
   */
  errorMessage?: string;

  /*
   * HTTP Status code of CMCI CICS REST API
   */
  statusCode?: number;

  /*
   * Generic error from the catch statement
   */
  baseError: any;

  /*
   * Resp1 Code from the ResultSummary
   */
  resp1Code?: number;

  /*
   * Resp1 Code from the ResultSummary
   */
  resp2Code?: number;
}
