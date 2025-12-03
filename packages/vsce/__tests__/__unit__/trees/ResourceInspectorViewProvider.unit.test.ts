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

const runGetResourceMock = jest.fn();
jest.mock("../../../src/utils/resourceUtils", () => ({
  runGetResource: runGetResourceMock,
}));

const toArrayMock = jest.fn((val) => (Array.isArray(val) ? val : [val]));
const findProfileAndShowJobSpoolMock = jest.fn();
jest.mock("../../../src/utils/commandUtils", () => ({
  toArray: toArrayMock,
  findProfileAndShowJobSpool: findProfileAndShowJobSpoolMock,
}));

jest.mock("../../../src/utils/CICSLogger", () => ({
  CICSLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const getProfileMock = jest.fn();
jest.mock("../../../src/resources", () => {
  const actual = jest.requireActual("../../../src/resources");
  return {
    ...actual,
    SessionHandler: {
      getInstance: jest.fn().mockReturnValue({
        getProfile: getProfileMock,
      }),
    },
  };
});

import { IPipeline } from "@zowe/cics-for-zowe-explorer-api";
import * as vscode from "vscode";
import { ExtensionContext, Uri, WebviewView } from "vscode";
import { PipelineMeta } from "../../../src/doc";
import { Resource } from "../../../src/resources";
import { ResourceInspectorViewProvider } from "../../../src/trees/ResourceInspectorViewProvider";

const executeCommandMock = jest.fn();
jest.spyOn(vscode.commands, "executeCommand").mockImplementation(executeCommandMock);

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
      default: "",
    },
    imperative: {
      Session: jest.fn(),
    },
  };
});

const resCxt = {
  profileName: "MYPROF",
  regionName: "MYREG",
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
      configfile: "/a/b/c/def.xml",
    }),
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
      localResourceRoots: [sampleExtensionContext.extensionUri, Uri.joinPath(sampleExtensionContext.extensionUri, "dist")],
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
    beforeEach(() => {
      getProfileMock.mockReturnValue({
        name: "MYPROF",
        host: "example.com",
        port: 1234,
      });
    });

    it("should call findProfileAndShowJobSpool when region data is found", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG", cicsplexName: "MYPLEX" });

      const mockRegionData = {
        jobid: "JOB12345",
        jobname: "TESTJOB",
      };

      runGetResourceMock.mockResolvedValue({
        response: {
          records: {
            cicsregion: [mockRegionData],
          },
        },
      });

      findProfileAndShowJobSpoolMock.mockClear();

      // @ts-ignore - calling private method for test
      await ri.handleShowLogsForHyperlink();

      expect(runGetResourceMock).toHaveBeenCalledWith({
        profileName: "MYPROF",
        resourceName: "CICSRegion",
        regionName: "MYREG",
        cicsPlex: "MYPLEX",
      });
      expect(findProfileAndShowJobSpoolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "MYPROF",
          host: "example.com",
          port: 1234,
        }),
        "JOB12345",
        "MYREG"
      );
    });

    it("should show error message when region records are empty", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG", cicsplexName: "MYPLEX" });

      runGetResourceMock.mockResolvedValue({
        response: {
          records: {
            cicsregion: [],
          },
        },
      });

      const showErrorMessageSpy = jest.spyOn(require("vscode").window, "showErrorMessage");
      findProfileAndShowJobSpoolMock.mockClear();

      // @ts-ignore - calling private method for test
      await ri.handleShowLogsForHyperlink();

      expect(runGetResourceMock).toHaveBeenCalled();
      expect(showErrorMessageSpy).toHaveBeenCalledWith("Could not find region data and job id for region MYREG to show logs.");
      expect(findProfileAndShowJobSpoolMock).not.toHaveBeenCalled();
    });

    it("should show error message when region records are not found", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG", cicsplexName: "MYPLEX" });

      runGetResourceMock.mockResolvedValue({
        response: {
          records: {},
        },
      });

      const showErrorMessageSpy = jest.spyOn(require("vscode").window, "showErrorMessage");
      findProfileAndShowJobSpoolMock.mockClear();

      // @ts-ignore - calling private method for test
      await ri.handleShowLogsForHyperlink();

      expect(runGetResourceMock).toHaveBeenCalled();
      expect(showErrorMessageSpy).toHaveBeenCalledWith("Could not find any record for region MYREG to show logs.");
      expect(findProfileAndShowJobSpoolMock).not.toHaveBeenCalled();
    });

    it("should show error message when runGetResource throws an error", async () => {
      const ri = ResourceInspectorViewProvider.getInstance(sampleExtensionContext);
      ri.setResourceContext({ profileName: "MYPROF", regionName: "MYREG", cicsplexName: "MYPLEX" });

      const errorMessage = "API connection failed";
      runGetResourceMock.mockRejectedValue(new Error(errorMessage));

      const showErrorMessageSpy = jest.spyOn(require("vscode").window, "showErrorMessage");
      findProfileAndShowJobSpoolMock.mockClear();

      // @ts-ignore - calling private method for test
      await ri.handleShowLogsForHyperlink();

      expect(runGetResourceMock).toHaveBeenCalled();
      expect(showErrorMessageSpy).toHaveBeenCalledWith(`Failed to show logs for region MYREG: ${errorMessage}`);
      expect(findProfileAndShowJobSpoolMock).not.toHaveBeenCalled();
    });
  });
});
