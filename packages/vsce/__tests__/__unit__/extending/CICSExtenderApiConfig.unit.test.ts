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

import CICSExtenderApiConfig from "../../../src/extending/CICSExtenderApiConfig";
import { IExtensionAPI } from "@zowe/cics-for-zowe-explorer-api";

describe("CICS Extender Api Tests", () => {
  it("should return resource configuration", () => {
    const config: IExtensionAPI = CICSExtenderApiConfig.getAPI();
    expect(config).toHaveProperty('resources.supportedResources');
  });

  it("should return supported resources configuration", () => {
    const config: IExtensionAPI = CICSExtenderApiConfig.getAPI();
    expect(config).toHaveProperty('resources.supportedResources');
    expect(config.resources.supportedResources).toHaveLength(10);
  });
});
