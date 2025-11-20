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

const getJobIdForRegionMock = jest.fn();
jest.mock("../../../src/commands/showLogsCommand", () => ({
  getJobIdForRegion: getJobIdForRegionMock,
}));

jest.mock("../../../src/utils/CICSLogger", () => ({
  CICSLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { ResourceInspectorViewProvider } from "../../../src/trees/ResourceInspectorViewProvider";
import * as vscode from "vscode";

const executeCommandMock = jest.fn();
jest.spyOn(vscode.commands, "executeCommand").mockImplementation(executeCommandMock);
import { PipelineMeta } from "../../../src/doc";
import { Resource } from "../../../src/resources";
import { Uri, WebviewView, ExtensionContext } from "vscode";
import { IPipeline } from "@zowe/cics-for-zowe-explorer-api";
import { CICSTree } from "../../../src/trees/CICSTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";

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

  describe("handleShowLogsForHyperlink", () => {
    it("should call showRegionLogs command when region node and jobId are found", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG", cicsplexName: "MYPLEX" });

      const mockRegionNode = {
        getRegionName: jest.fn().mockReturnValue("MYREG"),
      } as unknown as CICSRegionTree;

      const mockSessionNode = {
        getProfile: jest.fn().mockReturnValue({ name: "MYPROF" }),
        getRegionNodeFromName: jest.fn().mockReturnValue(mockRegionNode),
      } as unknown as CICSSessionTree;

      const mockCicsTree = {
        getChildren: jest.fn().mockResolvedValue([mockSessionNode]),
      } as unknown as CICSTree;

      // @ts-ignore - setting private property for test
      ri.cicsTree = mockCicsTree;

      getJobIdForRegionMock.mockResolvedValue("JOB12345");
      executeCommandMock.mockClear();

      // @ts-ignore - calling private method for test
      await ri.handleShowLogsForHyperlink();

      expect(getJobIdForRegionMock).toHaveBeenCalledWith(mockRegionNode);
      expect(executeCommandMock).toHaveBeenCalledWith("cics-extension-for-zowe.showRegionLogs", mockRegionNode);
    });

    it("should not call showRegionLogs command when jobId is not found", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG" });

      const mockRegionNode = {
        getRegionName: jest.fn().mockReturnValue("MYREG"),
      } as unknown as CICSRegionTree;

      const mockSessionNode = {
        getProfile: jest.fn().mockReturnValue({ name: "MYPROF" }),
        getRegionNodeFromName: jest.fn().mockReturnValue(mockRegionNode),
      } as unknown as CICSSessionTree;

      const mockCicsTree = {
        getChildren: jest.fn().mockResolvedValue([mockSessionNode]),
      } as unknown as CICSTree;

      // @ts-ignore - setting private property for test
      ri.cicsTree = mockCicsTree;

      getJobIdForRegionMock.mockResolvedValue(null);
      executeCommandMock.mockClear();

      // @ts-ignore - calling private method for test
      await ri.handleShowLogsForHyperlink();

      expect(getJobIdForRegionMock).toHaveBeenCalledWith(mockRegionNode);
      expect(executeCommandMock).not.toHaveBeenCalled();
    });

    it("should not call showRegionLogs command when region node is not found", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG" });

      const mockSessionNode = {
        getProfile: jest.fn().mockReturnValue({ name: "MYPROF" }),
        getRegionNodeFromName: jest.fn().mockReturnValue(undefined),
      } as unknown as CICSSessionTree;

      const mockCicsTree = {
        getChildren: jest.fn().mockResolvedValue([mockSessionNode]),
      } as unknown as CICSTree;

      // @ts-ignore - setting private property for test
      ri.cicsTree = mockCicsTree;

      executeCommandMock.mockClear();
      getJobIdForRegionMock.mockClear();

      // @ts-ignore - calling private method for test
      await ri.handleShowLogsForHyperlink();

      expect(getJobIdForRegionMock).not.toHaveBeenCalled();
      expect(executeCommandMock).not.toHaveBeenCalled();
    });
  });

  describe("findRegionNode", () => {
    it("should find region node using resourceContext", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG", cicsplexName: "MYPLEX" });

      const mockRegionNode = {
        getRegionName: jest.fn().mockReturnValue("MYREG"),
      } as unknown as CICSRegionTree;

      const mockSessionNode = {
        getProfile: jest.fn().mockReturnValue({ name: "MYPROF" }),
        getRegionNodeFromName: jest.fn().mockReturnValue(mockRegionNode),
      } as unknown as CICSSessionTree;

      const mockCicsTree = {
        getChildren: jest.fn().mockResolvedValue([mockSessionNode]),
      } as unknown as CICSTree;

      // @ts-ignore - setting private property for test
      ri.cicsTree = mockCicsTree;

      // @ts-ignore - calling private method for test
      const result = await ri.findRegionNode("MYREG", "MYPLEX");

      expect(result).toBe(mockRegionNode);
      expect(mockSessionNode.getRegionNodeFromName).toHaveBeenCalledWith("MYREG", "MYPLEX");
    });

    it("should return undefined when profile node is not found", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "WRONGPROF", regionName: "MYREG" });

      const mockSessionNode = {
        getProfile: jest.fn().mockReturnValue({ name: "MYPROF" }),
      } as unknown as CICSSessionTree;

      const mockCicsTree = {
        getChildren: jest.fn().mockResolvedValue([mockSessionNode]),
      } as unknown as CICSTree;

      // @ts-ignore - setting private property for test
      ri.cicsTree = mockCicsTree;

      // @ts-ignore - calling private method for test
      const result = await ri.findRegionNode("MYREG");

      expect(result).toBeUndefined();
    });

    it("should return undefined when cicsTree is not available", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG" });

      // @ts-ignore - setting private property for test
      ri.cicsTree = undefined;

      // @ts-ignore - calling private method for test
      const result = await ri.findRegionNode("MYREG");

      expect(result).toBeUndefined();
    });
  });
});
