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

import { ExtensionContext } from "vscode";
import { activate } from "../../src/extension";

describe("extension", () => {
  it("should return API", async () => {
    const returnedAPI = await activate({ subscriptions: [] } as unknown as ExtensionContext);

    expect(returnedAPI).toBeDefined();
    expect(returnedAPI).toHaveProperty("resources");
    expect(Object.keys(returnedAPI)).toHaveLength(1);

    expect(returnedAPI.resources).toHaveProperty("supportedResources");
    expect(returnedAPI.resources).toHaveProperty("resourceExtender");
    expect(Object.keys(returnedAPI.resources)).toHaveLength(2);

    expect(returnedAPI.resources.supportedResources).toBeInstanceOf(Array);
    expect(returnedAPI.resources.supportedResources).toHaveLength(16);
    expect(returnedAPI.resources.supportedResources).toContain("CICSProgram");
    expect(returnedAPI.resources.supportedResources).toContain("CICSLocalFile");
    expect(returnedAPI.resources.supportedResources).toContain("CICSTask");
  });
});
