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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";

export class CICSExtenderApiConfig {
  private static api: CICSExtenderApiConfig = new CICSExtenderApiConfig();
  private config: any = { "configuration": {} };

  public static getInstance(): CICSExtenderApiConfig {
    return this.api;
  }

  private constructor() {
    this.registerResourceTypes();
    this.registerResourceInspector();
  }

  private registerResourceTypes(): void {
    this.config["configuration"]["supportedResources"] = [
            CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
            CicsCmciConstants.CICS_PROGRAM_RESOURCE,
            CicsCmciConstants.CICS_CMCI_LOCAL_TRANSACTION,
            CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE,
            CicsCmciConstants.CICS_LIBRARY_RESOURCE,
            CicsCmciConstants.CICS_URIMAP,
            CicsCmciConstants.CICS_CMCI_TASK,
            CicsCmciConstants.CICS_CMCI_PIPELINE,
            CicsCmciConstants.CICS_CMCI_WEB_SERVICE,
          ];
  }

  private registerResourceInspector(): void {
    this.config["configuration"]["resourceInspector"] = {
      "enabled": false
    };
  }

  public getConfig(): any {
    return this.config;
  }
}
