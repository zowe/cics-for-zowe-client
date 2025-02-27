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

import { IResourceQueryParams } from "./IResourceQueryParms";

export interface IGetResourceUriOptions {
  /**
   * CICS Plex of the program
   */
  cicsPlex?: string;

  /**
   * The name of the CICS region of the program
   */
  regionName?: string;

  /**
   * Criteria by which to filter the records
   *
   * Examples:
   *    "TRANID=TRAN"
   *    "PROGRAM=PRG*"
   *    "NAME=C* AND PROGRAM=D*"
   */
  criteria?: string;

  /**
   * Parameter by which to refine the records
   *
   * Example:
   *    "CSDGROUP(GRP1)"
   *    "CSDGROUP(D*)"
   */
  parameter?: string;

  /**
   *  Query parameters to be used in the HTTP request
   */
  queryParams?: IResourceQueryParams;
}
