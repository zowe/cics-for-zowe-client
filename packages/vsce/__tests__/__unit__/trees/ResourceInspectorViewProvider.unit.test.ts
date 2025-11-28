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
import { PipelineMeta } from "../../../src/doc";
import { Resource } from "../../../src/resources";
import { Uri, WebviewView, ExtensionContext } from "vscode";
import { IPipeline } from "@zowe/cics-for-zowe-explorer-api";

const sampleExtensionContext: ExtensionContext = {
  extensionUri: {
    path: "/mock/script/fs/path",
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

const resCxt = {
  profileName: "MYPROF",
  regionName: "MYREG"
};

describe("Resource Inspector View provider", () => {

  const myResource = {
    meta: PipelineMeta,
    resource: new Resource<IPipeline>({
      eyu_cicsname: "MYREGION",
      name: "PIP1",
      enablestatus: "ENABLED",
      soaplevel: "1.1",
      wsdir: "/a/b/c",
      configfile: "/a/b/c/def.xml"
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

  it("should resolve webview", () => {
    // Mock Uri.joinPath to return a dummy object or string
    Uri.joinPath = jest.fn().mockReturnValue({
      toString: () => "mock-script-uri",
      fsPath: "/mock/script/fs/path",
    } as Uri);

    const webviewViewMock = {
      webview: {
        options: {},
        onDidReceiveMessage: jest.fn(),
        postMessage: jest.fn(),
        asWebviewUri: jest.fn().mockReturnValue("asdf"),
      },
      onDidDispose: jest.fn(),
    };

    const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
    ri.setResourceContext(resCxt);
    ri.resolveWebviewView(webviewViewMock as unknown as WebviewView);
    // @ts-ignore - private property not accessible
    expect(ri.webviewView?.webview.options).toEqual({
      enableScripts: true,
      localResourceRoots: [
        sampleExtensionContext.extensionUri,
        Uri.joinPath(sampleExtensionContext.extensionUri, 'dist')
      ],
    });
    // @ts-ignore - private property not accessible
    expect(ri.webviewView?.webview.html).toEqual(``);
    // @ts-ignore - private property not accessible
    expect(ri.webviewView?.webview.onDidReceiveMessage).toBeDefined();
  });

  it("should set resource when webview ready", () => {
    const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
    ri.setResourceContext(resCxt);

    // @ts-ignore - private property not accessible
    const sendSpy = jest.spyOn(ri, "sendResourceDataToWebView");
    expect(sendSpy).toHaveBeenCalledTimes(0);

    // @ts-ignore - private property not accessible
    ri.webviewReady = true;
    ri.setResource(myResource);
    // @ts-ignore - private property not accessible
    expect(ri.resource).toEqual(myResource);
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});
