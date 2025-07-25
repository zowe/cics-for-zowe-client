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

jest.mock("../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    apiDoesExist: jest.fn().mockReturnValue(true),
    registerCICSProfiles: jest.fn(),
    profilesCacheRefresh: jest.fn(),
    getProfilesCache: jest.fn().mockReturnValue({
      fetchBaseProfile: jest.fn(),
      registerCustomProfilesType: jest.fn(),
    }),
    getExplorerApis: jest.fn().mockReturnValue({
      getExplorerExtenderApi: jest.fn().mockReturnValue({
        reloadProfiles: jest.fn(),
      }),
    }),
  },
}));
jest.mock("../../src/utils/workspaceUtils", () => {
  return {
    getZoweExplorerVersion: jest.fn().mockReturnValue("3.0.0"),
  };
});
jest.mock("../../src/utils/CICSLogger");

import { ExtensionContext, TreeView, window } from "vscode";
import { activate } from "../../src/extension";

jest.spyOn(window, "createTreeView").mockReturnValue({
  onDidExpandElement: jest.fn(),
  onDidCollapseElement: jest.fn(),
  registerWebviewViewProvider: jest.fn(),
} as unknown as TreeView<any>);

describe("extension", () => {
  it("should return API", async () => {
    const returnedAPI = await activate({ subscriptions: [] } as unknown as ExtensionContext);

    expect(returnedAPI).toBeDefined();
    expect(returnedAPI).toHaveProperty("resources");
    expect(Object.keys(returnedAPI)).toHaveLength(1);

    expect(returnedAPI.resources).toHaveProperty("supportedResources");
    expect(Object.keys(returnedAPI.resources)).toHaveLength(1);

    expect(returnedAPI.resources.supportedResources).toBeInstanceOf(Array);
    expect(returnedAPI.resources.supportedResources).toHaveLength(10);
    expect(returnedAPI.resources.supportedResources).toContain("CICSProgram");
    expect(returnedAPI.resources.supportedResources).toContain("CICSLocalFile");
    expect(returnedAPI.resources.supportedResources).toContain("CICSTask");
  });
});
