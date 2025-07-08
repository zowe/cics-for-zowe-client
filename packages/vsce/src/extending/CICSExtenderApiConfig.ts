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

import { IExtensionAPI, SupportedResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

class SCICSExtenderApiConfig {
  private static _instance: SCICSExtenderApiConfig;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  private api: IExtensionAPI;

  private constructor() {
    this.api = {
      resources: {
        supportedResources: SupportedResourceTypes,
      },
    };
  }

  getAPI(): IExtensionAPI {
    return this.api;
  }
}

const CICSExtenderApiConfig = SCICSExtenderApiConfig.Instance;
export default CICSExtenderApiConfig;
