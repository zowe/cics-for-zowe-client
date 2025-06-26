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

/**
 * Parameters passed to a command
 */
export interface ICommandParams {
  /**
   * Name of resource to find in filter
   */
  name: string;
  /**
   * Region Applid to perform action
   */
  regionName: string;
  /**
   * CICS Plex to perform action
   */
  cicsPlex: string;
}
