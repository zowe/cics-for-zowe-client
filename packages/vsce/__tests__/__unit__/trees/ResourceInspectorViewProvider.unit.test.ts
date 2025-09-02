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

const getProfilesCacheMock = jest.fn();
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: getProfilesCacheMock,
  },
}));

import { ResourceInspectorViewProvider } from "../../../src/trees/ResourceInspectorViewProvider";
import { IPipeline, PipelineMeta } from "../../../src/doc";
import { Resource } from "../../../src/resources";
import { Uri, WebviewView, ExtensionContext } from "vscode";

const sampleExtensionContext: ExtensionContext = {
  extensionUri: {
    path: "asdf",
  } as Uri,

  // Minimal stubs for remaining required fields
  subscriptions: [],
  workspaceState: {} as any,
  globalState: { setKeysForSync: () => {} } as any,
  secrets: {} as any,
  extensionPath: "",
  environmentVariableCollection: {} as any,
  asAbsolutePath: (relativePath: string) => relativePath,
  storageUri: undefined,
  storagePath: undefined,
  globalStorageUri: {} as Uri,
  globalStoragePath: "",
  logUri: {} as Uri,
  logPath: "",
  extensionMode: 1,
  extension: {} as any,
  languageModelAccessInformation: {} as any,
};

jest.mock("@zowe/zowe-explorer-api", () => {
  return {
    HTMLTemplate: {
      default: ""
    },
    imperative: {
      Session: jest.fn()
    }
  };
});

describe("Resource Inspector View provider", () => {

  const myResource = {
    meta: PipelineMeta,
    resource: new Resource<IPipeline>({
      enablestatus: "ENABLED",
      eyu_cicsname: "MYREGION",
      name: "PIP1",
      status: "ENABLED",
    })
  };

  it("should return singleton instance", () => {
    const instance1 = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
    const instance2 = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
    expect(instance1).toEqual(instance2);
  });

  it("should set resource when webview NOT ready", () => {
    const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
    ri.setResource(myResource);
    // @ts-ignore - private property not accessible
    expect(ri.resource).toEqual(myResource);
  });
});
