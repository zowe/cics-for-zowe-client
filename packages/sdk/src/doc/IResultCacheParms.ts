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

import type { IResourceQueryParams } from "./IResourceQueryParms";

export interface IResultCacheParms extends IResourceQueryParams {
  /**
   * Index of first record to collect from the results cache
   */
  startIndex?: number;

  /**
   * Number of records to fetch from the cache
   */
  count?: number;
}
