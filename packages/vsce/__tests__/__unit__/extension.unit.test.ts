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

import { ExtensionContext, window } from "vscode";
import { activate, deactivate } from "../../src/extension";
import { ProfileManagement } from "../../src/utils/profileManagement";
import { getZoweExplorerVersion } from "../../src/utils/workspaceUtils";
import { CICSLogger } from "../../src/utils/CICSLogger";
import PersistentStorage from "../../src/utils/PersistentStorage";
import { CICSTree } from "../../src/trees/CICSTree";

jest.mock("vscode");
jest.mock("../../src/utils/profileManagement");
jest.mock("../../src/utils/workspaceUtils");
jest.mock("../../src/utils/CICSLogger");
jest.mock("../../src/utils/PersistentStorage");
jest.mock("../../src/trees/CICSTree");

describe("extension", () => {
  let mockContext: ExtensionContext;
  let mockTreeView: any;
  let mockProfilesCache: any;
  let mockApiRegister: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {
      subscriptions: [],
    } as unknown as ExtensionContext;

    mockTreeView = {
      onDidExpandElement: jest.fn(),
      onDidCollapseElement: jest.fn(),
    };

    mockProfilesCache = {
      registerCustomProfilesType: jest.fn(),
    };

    mockApiRegister = {
      getExplorerExtenderApi: jest.fn().mockReturnValue({
        reloadProfiles: jest.fn().mockResolvedValue(undefined),
      }),
      onProfilesUpdate: jest.fn(),
    };

    (window.createTreeView as jest.Mock) = jest.fn().mockReturnValue(mockTreeView);
    (window.showErrorMessage as jest.Mock) = jest.fn();
    (getZoweExplorerVersion as jest.Mock) = jest.fn().mockReturnValue("3.0.0");
    (ProfileManagement.apiDoesExist as jest.Mock) = jest.fn().mockReturnValue(true);
    (ProfileManagement.registerCICSProfiles as jest.Mock) = jest.fn().mockResolvedValue(undefined);
    (ProfileManagement.getProfilesCache as jest.Mock) = jest.fn().mockReturnValue(mockProfilesCache);
    (ProfileManagement.getExplorerApis as jest.Mock) = jest.fn().mockResolvedValue(mockApiRegister);
    (PersistentStorage.setContext as jest.Mock) = jest.fn();
    (CICSLogger.error as jest.Mock) = jest.fn();
    (CICSLogger.debug as jest.Mock) = jest.fn();
    (CICSLogger.dispose as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    const mockCICSTree = {
      refreshLoadedProfiles: jest.fn().mockResolvedValue(undefined),
      hookCollapseWatcher: jest.fn(),
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };
    (CICSTree as jest.Mock) = jest.fn().mockReturnValue(mockCICSTree);
  });

  describe("activate", () => {
    it("should return API when successfully activated", async () => {
      const returnedAPI = await activate(mockContext);

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

    it("should call onProfilesUpdate callback when profiles are updated", async () => {
      let profileUpdateCallback: any;
      mockApiRegister.onProfilesUpdate = jest.fn((cb) => {
        profileUpdateCallback = cb;
      });

      await activate(mockContext);

      expect(mockApiRegister.onProfilesUpdate).toHaveBeenCalled();
      expect(profileUpdateCallback).toBeDefined();

      // Trigger the callback
      await profileUpdateCallback();

      const mockCICSTreeInstance = (CICSTree as jest.Mock).mock.results[0].value;
      expect(mockCICSTreeInstance.refreshLoadedProfiles).toHaveBeenCalled();
    });

    it("should return undefined when Zowe Explorer is not found", async () => {
      (getZoweExplorerVersion as jest.Mock) = jest.fn().mockReturnValue(null);

      const returnedAPI = await activate(mockContext);

      expect(returnedAPI).toBeUndefined();
      expect(CICSLogger.error).toHaveBeenCalled();
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Zowe Explorer")
      );
    });

    it("should return undefined when Zowe Explorer version is not 3.x", async () => {
      (getZoweExplorerVersion as jest.Mock) = jest.fn().mockReturnValue("2.15.0");

      const returnedAPI = await activate(mockContext);

      expect(returnedAPI).toBeUndefined();
      expect(CICSLogger.error).toHaveBeenCalled();
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Current version of Zowe Explorer is 2.15.0")
      );
    });

    it("should return undefined when ProfileManagement API does not exist", async () => {
      (ProfileManagement.apiDoesExist as jest.Mock) = jest.fn().mockReturnValue(false);

      const returnedAPI = await activate(mockContext);

      expect(returnedAPI).toBeUndefined();
      expect(CICSLogger.error).toHaveBeenCalled();
      expect(window.showErrorMessage).toHaveBeenCalled();
    });

    it("should return undefined when profile registration fails", async () => {
      (ProfileManagement.registerCICSProfiles as jest.Mock) = jest.fn().mockRejectedValue(
        new Error("Registration failed")
      );

      const returnedAPI = await activate(mockContext);

      expect(returnedAPI).toBeUndefined();
      expect(CICSLogger.error).toHaveBeenCalled();
    });

    it("should register onProfilesUpdate callback when available", async () => {
      const onProfilesUpdateCallback = jest.fn();
      mockApiRegister.onProfilesUpdate = onProfilesUpdateCallback;

      await activate(mockContext);

      expect(onProfilesUpdateCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should handle tree view expand events", async () => {
      let expandCallback: any;
      mockTreeView.onDidExpandElement = jest.fn((cb) => {
        expandCallback = cb;
      });

      await activate(mockContext);

      const mockElement = {
        refreshIcon: jest.fn(),
      };
      expandCallback({ element: mockElement });

      expect(mockElement.refreshIcon).toHaveBeenCalledWith(true);
    });

    it("should handle tree view expand events without refreshIcon", async () => {
      let expandCallback: any;
      mockTreeView.onDidExpandElement = jest.fn((cb) => {
        expandCallback = cb;
      });

      await activate(mockContext);

      const mockElement = {};
      expandCallback({ element: mockElement });

      // Should not throw error
      expect(expandCallback).toBeDefined();
    });

    it("should handle tree view collapse events for regions container", async () => {
      let collapseCallback: any;
      mockTreeView.onDidCollapseElement = jest.fn((cb) => {
        collapseCallback = cb;
      });

      await activate(mockContext);

      const mockElement = {
        contextValue: "cicsregionscontainer.test",
        iconPath: null as any,
        refreshIcon: jest.fn(),
      };
      collapseCallback({ element: mockElement });

      expect(mockElement.iconPath).toBeDefined();
      expect(mockElement.refreshIcon).toHaveBeenCalled();
    });

    it("should handle tree view collapse events for non-regions container", async () => {
      let collapseCallback: any;
      mockTreeView.onDidCollapseElement = jest.fn((cb) => {
        collapseCallback = cb;
      });

      await activate(mockContext);

      const mockElement = {
        contextValue: "other.context",
        refreshIcon: jest.fn(),
      };
      collapseCallback({ element: mockElement });

      expect(mockElement.refreshIcon).toHaveBeenCalled();
    });

    it("should register commands and webview provider", async () => {
      await activate(mockContext);

      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });

    it("should set persistent storage context", async () => {
      await activate(mockContext);

      expect(PersistentStorage.setContext).toHaveBeenCalledWith(mockContext);
    });

    it("should create tree view with correct options", async () => {
      await activate(mockContext);

      expect(window.createTreeView).toHaveBeenCalledWith("cics-view", {
        treeDataProvider: expect.any(Object),
        showCollapseAll: true,
        canSelectMany: true,
      });
    });
  });

  describe("deactivate", () => {
    it("should dispose CICSLogger", async () => {
      await deactivate();

      expect(CICSLogger.dispose).toHaveBeenCalled();
    });
  });
});
