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

import { IExtensionAPI } from "../../src/interfaces/IExtensionAPI";
import { IResource } from "../../src/interfaces/IResource";
import { SupportedResourceTypes } from "../../src/resources";

describe("Interfaces", () => {

  const api: IExtensionAPI = {
    resources: {
      supportedResources: SupportedResourceTypes,
    },
  };

  const res: IResource = {
    eyu_cicsname: "REGION1",
    status: "ENABLED",
  };

  it("should assert IExtensionAPI", () => {
    expect(api).toHaveProperty("resources");
    expect(api.resources).toHaveProperty("supportedResources");
  });
  it("should assert IResource", () => {
    expect(res).toHaveProperty("eyu_cicsname");
    expect(res).toHaveProperty("status");
  });
});
