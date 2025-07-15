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
import { Uri, WebviewView } from "vscode";

jest.mock("vscode", () => {
  return {
    Uri: {
      joinPath: jest.fn().mockReturnValue("asdf"),
      parse: jest.fn(),
    },
    workspace: {
      getConfiguration: jest.fn()
    }
  };
});
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
    const instance1 = ResourceInspectorViewProvider.getInstance({} as Uri);
    const instance2 = ResourceInspectorViewProvider.getInstance({} as Uri);
    expect(instance1).toEqual(instance2);
  });

  it("should set resource when webview NOT ready", () => {
    const ri = ResourceInspectorViewProvider.getInstance({} as Uri);
    ri.setResource(myResource);
    // @ts-ignore - private property not accessible
    expect(ri.resource).toEqual(myResource);
  });

  it("should resolve webview", () => {

    const webviewViewMock = {
      webview: {
        options: {},
        onDidReceiveMessage: jest.fn(),
        postMessage: jest.fn(),
        asWebviewUri: jest.fn().mockReturnValue("asdf"),
      },
      onDidDispose: jest.fn(),
    };

    const ri = ResourceInspectorViewProvider.getInstance({ path: "asdf" } as Uri);
    ri.resolveWebviewView(webviewViewMock as unknown as WebviewView);
    // @ts-ignore - private property not accessible
    expect(ri.webviewView?.webview.options).toEqual({
      enableScripts: true,
      localResourceRoots: [{} as Uri],
    });
    // @ts-ignore - private property not accessible
    expect(ri.webviewView?.webview.html).toEqual(``);
    // @ts-ignore - private property not accessible
    expect(ri.webviewView?.webview.onDidReceiveMessage).toBeDefined();

  });

  it("should set resource when webview ready", () => {
    const ri = ResourceInspectorViewProvider.getInstance({} as Uri);

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
