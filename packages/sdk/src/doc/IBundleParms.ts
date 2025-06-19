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

export interface IBundleParms {
  /**
   * The name of the bundle
   * Up to eight characters long
   */
  name: string;

  /**
   * The bundle directory
   * Up to 255 characters long, starting and ending with /
   */
  bundleDir: string;

  /**
   * CSD group for the bundle
   * Up to eight characters long
   */
  csdGroup: string;

  /**
   * The name of the CICS region of the bundle
   */
  regionName: string;

  /**
   * CICS Plex of the bundle
   */
  cicsPlex?: string;
}
