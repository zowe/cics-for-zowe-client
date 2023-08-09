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
 * Interface representing the values in the custom_properties.yaml file
 * see example_properties.yaml for descriptions and more details
 */
export interface ITestPropertiesSchema {
  /**
   * Properties related to connecting to CICS
   */
  cics: {
    /**
     * user ID to connect to CICS
     */
    user: string;
    /**
     * Password to connect to CICS
     */
    password: string;
    /**
     * host name
     */
    host: string;
    /**
     * Port for CMCI
     */
    port?: number;
    /**
     * http or https protocol
     */
    protocol?: string;

    /**
     * Whether or not to reject slef-signed certs
     */
    rejectUnauthorized?: boolean;
  };

  cmci: {
    /**
     * CSD group to define resources to CMCI
     */
    csdGroup?: string;

    /**
     * Name of the CICS region e.g. "CICSCMCI"
     */
    regionName?: string;
  }

  urimap: {
    /**
     * Name of the certificate to use for CICS Client Testing
     */
    certificate?: string;
  };
}
