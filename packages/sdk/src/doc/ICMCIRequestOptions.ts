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

export interface ICMCIRequestOptions {
  /**
   * If False, the request does NOT fail if CMCI gives a NODATA response, indicating 0 results.
   */
  failOnNoData?: boolean;

  /**
   * If True, a new CicsCmciRestError is returned with formatted CMCI response codes.
   * Default value is False to maintain backward compatibility.
   */
  useCICSCmciRestError?: boolean;
}
