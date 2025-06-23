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

import { CicsCmciConstants, ICICSExtenderConfig } from "@zowe/cics-for-zowe-sdk";
import { SupportedResources } from "../model";

export class CICSExtenderApiConfig {
  private static api: CICSExtenderApiConfig = new CICSExtenderApiConfig();
  private config: ICICSExtenderConfig;

  public static getInstance(): CICSExtenderApiConfig {
    return this.api;
  }

  private constructor() {
    this.config = {
      configuration: {
        supportedResources: SupportedResources.resources,
        resourceInspector: {
          enabled: false
        }
      }
    };
  }

  public getConfig(): ICICSExtenderConfig {
    return this.config;
  }
}
