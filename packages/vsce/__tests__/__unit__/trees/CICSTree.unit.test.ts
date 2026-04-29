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

import { CICSTree } from "../../../src/trees/CICSTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import { loadNamedProfileMock, profile, anotherProfile } from "../../__mocks__";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import { Gui, ZoweVsCodeExtension, FileManagement } from "@zowe/zowe-explorer-api";
import { commands, window } from "vscode";
import { openConfigFile } from "../../../src/utils/workspaceUtils";
import { SessionHandler } from "../../../src/resources";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";

jest.mock("../../../src/utils/workspaceUtils");
jest.mock("../../../src/resources");

const mockContext = {
  workspaceState: {
    get: jest.fn(),
    update: jest.fn(),
    keys: jest.fn().mockReturnValue([]),
  },
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
    setKeysForSync: jest.fn(),
  },
} as any;

PersistentStorage.setContext(mockContext);

const removeLoadedCICSProfileSpy = jest.spyOn(PersistentStorage, "removeLoadedCICSProfile").mockResolvedValue(undefined);
const getProfilesCacheMock = jest.spyOn(ProfileManagement, "getProfilesCache");
jest.spyOn(PersistentStorage, "getCriteriaKeysForSession").mockImplementation((nm: string) => []);
const appendLoadedCICSProfileSpy = jest.spyOn(PersistentStorage, "appendLoadedCICSProfile").mockResolvedValue(undefined);

describe("Test suite for CICSTree", () => {
  let sut: CICSTree;

  beforeEach(() => {
    jest.clearAllMocks();
    sut = new CICSTree();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("Should have children", () => {
    expect(sut.loadedProfiles).toBeDefined();
    expect(sut.loadedProfiles).toHaveLength(3);
  });

  it("Should getLoadedProfiles", () => {
    const loadedProfs = sut.getLoadedProfiles();
    expect(loadedProfs).toBeDefined();
    expect(loadedProfs).toHaveLength(3);
  });

  it("Should clear profiles", () => {
    const loadedProfs = sut.getLoadedProfiles();
    expect(loadedProfs).toBeDefined();
    expect(loadedProfs).toHaveLength(3);

    sut.clearLoadedProfiles();
    expect(sut.loadedProfiles).toBeDefined();
    expect(sut.loadedProfiles).toHaveLength(0);
  });

  it("Should return the children", () => {
    expect(sut.getChildren()).toHaveLength(3);
  });

  it("Should remove loaded cics profile when throws profile not found error", async () => {
    // Mock ProfileManagement.profilesCacheRefresh
    jest.spyOn(ProfileManagement, 'profilesCacheRefresh').mockResolvedValue(undefined);
    
    loadNamedProfileMock.mockImplementationOnce(() => {
      throw new Error("Could not find profile named: prof3");
    });
    await sut.loadStoredProfileNames();

    expect(getProfilesCacheMock).toHaveBeenCalled();
    expect(removeLoadedCICSProfileSpy).toHaveBeenCalledTimes(1);
  });

  it("Should load stored cics profiles", async () => {
    const expectedOrder = ["ANOTHERPROF", "MYPROF", "MYPROF2"];
    sut.loadedProfiles.forEach((profile, index) => {
      expect(profile.label).toBe(expectedOrder[index]);
    });
  });

  it("Should get sorted tree items when refreshed", async () => {
    await sut.refresh();
    const expectedOrder = ["ANOTHERPROF", "MYPROF", "MYPROF2"];
    sut.loadedProfiles.forEach((profile, index) => {
      expect(profile.label).toBe(expectedOrder[index]);
    });
  });

  it("Should getSessionNodeForProfile", () => {
    const sessionNode = sut.getSessionNodeForProfile(profile);
    expect(sessionNode).toBeDefined();
    expect(sessionNode?.getProfile()).toBe(profile);
  });

  it("Should return undefined for non-existent profile in getSessionNodeForProfile", () => {
    const nonExistentProfile = { ...profile, name: "NONEXISTENT" };
    const sessionNode = sut.getSessionNodeForProfile(nonExistentProfile as any);
    expect(sessionNode).toBeUndefined();
  });

  it("Should refreshLoadedProfiles", async () => {
    const executeCommandSpy = jest.spyOn(commands, "executeCommand");
    await sut.refreshLoadedProfiles();
    expect(sut.loadedProfiles).toBeDefined();
    expect(executeCommandSpy).toHaveBeenCalledWith("workbench.actions.treeView.cics-view.collapseAll");
  });

  it("Should getTreeItem", () => {
    const sessionTree = sut.loadedProfiles[0];
    const treeItem = sut.getTreeItem(sessionTree);
    expect(treeItem).toBe(sessionTree);
  });

  it("Should getChildren for element", () => {
    const sessionTree = sut.loadedProfiles[0];
    const getChildrenSpy = jest.spyOn(sessionTree, "getChildren");
    sut.getChildren(sessionTree);
    expect(getChildrenSpy).toHaveBeenCalled();
  });

  it("Should getParent", () => {
    const mockElement = {
      getParent: jest.fn().mockReturnValue(null),
    };
    sut.getParent(mockElement);
    expect(mockElement.getParent).toHaveBeenCalled();
  });

  it("Should refresh with node", () => {
    const mockNode = {} as any;
    const fireSpy = jest.spyOn(sut._onDidChangeTreeData, "fire");
    sut.refresh(mockNode);
    expect(fireSpy).toHaveBeenCalledWith(mockNode);
  });

  describe("manageProfile", () => {
    let mockSessionTree: CICSSessionTree;
    let mockConfigInstance: any;
    let mockQuickPick: any;
    let mockProfileCache: any;

    beforeEach(() => {
      mockSessionTree = {
        getProfile: jest.fn().mockReturnValue(profile),
        setProfile: jest.fn(),
        reset: jest.fn(),
        requiresIconUpdate: false,
        label: "MYPROF",
      } as any;

      mockConfigInstance = {
        getTeamConfig: jest.fn().mockReturnValue({ exists: true }),
      };

      mockQuickPick = {
        items: [],
        placeholder: "",
        ignoreFocusOut: false,
        show: jest.fn(),
        hide: jest.fn(),
      };

      mockProfileCache = {
        loadNamedProfile: jest.fn().mockReturnValue(profile),
        getProfileFromConfig: jest.fn().mockResolvedValue({
          profLoc: { osLoc: ["/path/to/config.json"] },
        }),
      };

      jest.spyOn(ProfileManagement, "getConfigInstance").mockResolvedValue(mockConfigInstance);
      getProfilesCacheMock.mockReturnValue(mockProfileCache);
      jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick);
      jest.spyOn(Gui, "showMessage").mockImplementation();
    });

    it("Should handle user cancellation in manageProfile", async () => {
      const resolveQuickPickSpy = jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(undefined);
      const showMessageSpy = jest.spyOn(Gui, "showMessage");
      
      await sut.manageProfile(mockSessionTree);
      
      expect(resolveQuickPickSpy).toHaveBeenCalled();
      expect(showMessageSpy).toHaveBeenCalledWith("Profile selection has been cancelled.");
    });

    it("Should handle hide profile action", async () => {
      const hideProfileChoice = { label: "$(eye-closed) Hide Profile" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(hideProfileChoice as any);
      const removeSessionSpy = jest.spyOn(sut, "removeSession").mockResolvedValue(undefined);
      
      await sut.manageProfile(mockSessionTree);
      
      expect(removeSessionSpy).toHaveBeenCalledWith(mockSessionTree);
    });

    it("Should handle update credentials action", async () => {
      const updateCredsChoice = { label: "$(refresh) Update Credentials" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(updateCredsChoice as any);
      
      const updatedProfile = { ...profile, name: "UPDATED" };
      const updateCredentialsSpy = jest.fn().mockResolvedValue(updatedProfile);
      (ZoweVsCodeExtension as any).updateCredentials = updateCredentialsSpy;
      
      const mockSessionHandler = {
        removeProfile: jest.fn(),
        removeSession: jest.fn(),
        getSession: jest.fn(),
      };
      jest.spyOn(SessionHandler, "getInstance").mockReturnValue(mockSessionHandler as any);
      jest.spyOn(ProfileManagement, "getExplorerApis").mockReturnValue([] as any);
      
      const refreshSpy = jest.spyOn(sut, "refresh").mockImplementation();
      
      await sut.manageProfile(mockSessionTree);
      
      expect(updateCredentialsSpy).toHaveBeenCalled();
      expect(mockSessionTree.setProfile).toHaveBeenCalledWith(updatedProfile);
      expect(mockSessionTree.reset).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalled();
      expect(Gui.showMessage).toHaveBeenCalledWith("Credentials updated for profile UPDATED");
    });

    it("Should handle update credentials when user cancels", async () => {
      const updateCredsChoice = { label: "$(refresh) Update Credentials" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(updateCredsChoice as any);
      const updateCredentialsSpy = jest.fn().mockResolvedValue(undefined);
      (ZoweVsCodeExtension as any).updateCredentials = updateCredentialsSpy;
      jest.spyOn(ProfileManagement, "getExplorerApis").mockReturnValue([] as any);
      
      await sut.manageProfile(mockSessionTree);
      
      expect(updateCredentialsSpy).toHaveBeenCalled();
    });

    it("Should handle edit profile action", async () => {
      const editProfileChoice = { label: "$(pencil) Edit Profile" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(editProfileChoice as any);
      const openConfigFileSpy = openConfigFile as jest.Mock;
      
      await sut.manageProfile(mockSessionTree);
      
      expect(openConfigFileSpy).toHaveBeenCalledWith("/path/to/config.json");
    });

    it("Should handle delete profile action", async () => {
      const deleteProfileChoice = { label: "$(trash) Delete Profile" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(deleteProfileChoice as any);
      const openConfigFileSpy = openConfigFile as jest.Mock;
      
      await sut.manageProfile(mockSessionTree);
      
      expect(openConfigFileSpy).toHaveBeenCalledWith("/path/to/config.json");
    });

    it("Should handle error in manageProfile", async () => {
      jest.spyOn(ProfileManagement, "getConfigInstance").mockRejectedValue(new Error("Test error"));
      const showErrorMessageSpy = jest.spyOn(window, "showErrorMessage");
      
      await sut.manageProfile(mockSessionTree);
      
      expect(showErrorMessageSpy).toHaveBeenCalled();
    });
  });

  describe("addProfile", () => {
    let mockConfigInstance: any;
    let mockQuickPick: any;
    let mockProfileInfo: any;
    let mockProfileCache: any;

    beforeEach(() => {
      mockConfigInstance = {
        getTeamConfig: jest.fn().mockReturnValue({ exists: true }),
      };

      mockQuickPick = {
        items: [],
        placeholder: "",
        ignoreFocusOut: false,
        show: jest.fn(),
        hide: jest.fn(),
      };

      mockProfileInfo = {
        getAllProfiles: jest.fn().mockReturnValue([
          { profName: "NEWPROF", profType: "cics" },
          { profName: "MYPROF", profType: "cics" },
        ]),
        getOsLocInfo: jest.fn().mockReturnValue([{ global: true }]),
      };

      mockProfileCache = {
        getProfileInfo: jest.fn().mockResolvedValue(mockProfileInfo),
      };

      jest.spyOn(ProfileManagement, "getConfigInstance").mockResolvedValue(mockConfigInstance);
      jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick);
      jest.spyOn(Gui, "showMessage").mockImplementation();
      getProfilesCacheMock.mockReturnValue(mockProfileCache);
    });

    it("Should handle user cancellation in addProfile", async () => {
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(undefined);
      
      await sut.addProfile();
      
      expect(Gui.showMessage).toHaveBeenCalledWith("Profile selection has been cancelled.");
    });

    it("Should handle create new config action", async () => {
      const createNewChoice = { label: "\uFF0B Create a New Team Configuration File" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(createNewChoice as any);
      const executeCommandSpy = jest.spyOn(commands, "executeCommand").mockResolvedValue(undefined);
      
      await sut.addProfile();
      
      expect(executeCommandSpy).toHaveBeenCalledWith("zowe.all.config.init");
    });

    it("Should handle edit config action", async () => {
      const editConfigChoice = { label: "\u270F Edit Team Configuration File" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(editConfigChoice as any);
      const editZoweConfigFileSpy = jest.spyOn(sut, "editZoweConfigFile").mockResolvedValue(undefined);
      
      await sut.addProfile();
      
      expect(editZoweConfigFileSpy).toHaveBeenCalled();
    });

    it("Should handle loading existing profile", async () => {
      const profileChoice = { label: "$(home) NEWPROF" };
      jest.spyOn(Gui, "resolveQuickPick").mockResolvedValue(profileChoice as any);
      const loadExistingProfileSpy = jest.spyOn(sut, "loadExistingProfile");
      
      await sut.addProfile();
      
      expect(loadExistingProfileSpy).toHaveBeenCalledWith("$(home) NEWPROF");
    });

    it("Should handle no team config and no profiles", async () => {
      mockConfigInstance.getTeamConfig.mockReturnValue({ exists: false });
      mockProfileInfo.getAllProfiles.mockReturnValue(null);
      const executeCommandSpy = jest.spyOn(commands, "executeCommand");
      
      await sut.addProfile();
      
      expect(executeCommandSpy).toHaveBeenCalledWith("zowe.all.config.init");
    });

    it("Should handle error in addProfile", async () => {
      jest.spyOn(ProfileManagement, "getConfigInstance").mockRejectedValue(new Error("Test error"));
      const showErrorMessageSpy = jest.spyOn(window, "showErrorMessage");
      
      await sut.addProfile();
      
      expect(showErrorMessageSpy).toHaveBeenCalled();
    });
  });

  describe("editZoweConfigFile", () => {
    beforeEach(() => {
      jest.spyOn(FileManagement, "getZoweDir").mockReturnValue("/home/user/.zowe");
      (ZoweVsCodeExtension as any).workspaceRoot = { uri: { fsPath: "/workspace" } };
    });

    it("Should edit global config file", async () => {
      jest.spyOn(Gui, "showQuickPick").mockResolvedValue("Global: in the Zowe home directory" as any);
      
      await sut.editZoweConfigFile();
      
      expect(openConfigFile).toHaveBeenCalledWith("/home/user/.zowe/zowe.config.json");
    });

    it("Should edit project config file", async () => {
      jest.spyOn(Gui, "showQuickPick").mockResolvedValue("Project: in the current working directory" as any);
      
      await sut.editZoweConfigFile();
      
      expect(openConfigFile).toHaveBeenCalledWith("/workspace/zowe.config.json");
    });

    it("Should handle user cancellation in editZoweConfigFile", async () => {
      jest.spyOn(Gui, "showQuickPick").mockResolvedValue(undefined);
      
      await sut.editZoweConfigFile();
      
      expect(openConfigFile).not.toHaveBeenCalled();
    });
  });

  describe("loadExistingProfile", () => {
    it("Should load existing profile", async () => {
      const mockProfile = { ...profile, name: "NEWPROF" };
      const mockProfileCache = {
        getLoadedProfConfig: jest.fn().mockResolvedValue(mockProfile),
        loadNamedProfile: jest.fn().mockReturnValue(mockProfile),
      };
      
      // Mock ProfileManagement.getProfilesCache() to return our mock
      const getProfilesCacheSpy = jest.spyOn(ProfileManagement, 'getProfilesCache');
      getProfilesCacheSpy.mockReturnValue(mockProfileCache as any);
      
      const initialLength = sut.loadedProfiles.length;
      await sut.loadExistingProfile("$(home) NEWPROF");
      
      expect(mockProfileCache.getLoadedProfConfig).toHaveBeenCalledWith("NEWPROF");
      expect(appendLoadedCICSProfileSpy).toHaveBeenCalledWith("NEWPROF");
      expect(sut.loadedProfiles.length).toBe(initialLength + 1);
      
      getProfilesCacheSpy.mockRestore();
    });
  });

  describe("removeSession", () => {
    it("Should remove session", async () => {
      const sessionToRemove = sut.loadedProfiles[0];
      const initialLength = sut.loadedProfiles.length;
      
      await sut.removeSession(sessionToRemove);
      
      expect(removeLoadedCICSProfileSpy).toHaveBeenCalledWith(sessionToRemove.label?.toString());
      expect(sut.loadedProfiles.length).toBe(initialLength - 1);
    });
  });

  describe("hookCollapseWatcher", () => {
    it("Should hook collapse watcher and handle collapse event", async () => {
      const mockView = {
        onDidCollapseElement: jest.fn(),
      };
      
      sut.hookCollapseWatcher(mockView as any);
      
      expect(mockView.onDidCollapseElement).toHaveBeenCalled();
      
      // Get the callback function
      const callback = mockView.onDidCollapseElement.mock.calls[0][0];
      
      // Create a mock CICSResourceContainerNode
      const mockElement = {
        reset: jest.fn(),
      };
      const mockEvent = {
        element: mockElement,
      };
      
      // Simulate collapse event with CICSResourceContainerNode
      Object.setPrototypeOf(mockElement, CICSResourceContainerNode.prototype);
      const refreshSpy = jest.spyOn(sut, "refresh");
      
      await callback(mockEvent);
      
      expect(mockElement.reset).toHaveBeenCalled();
      expect(refreshSpy).toHaveBeenCalledWith(mockElement);
    });

    it("Should not reset element if not CICSResourceContainerNode", async () => {
      const mockView = {
        onDidCollapseElement: jest.fn(),
      };
      
      sut.hookCollapseWatcher(mockView as any);
      
      const callback = mockView.onDidCollapseElement.mock.calls[0][0];
      
      const mockElement = {
        reset: jest.fn(),
      };
      const mockEvent = {
        element: mockElement,
      };
      
      await callback(mockEvent);
      
      expect(mockElement.reset).not.toHaveBeenCalled();
    });
  });

  describe("constructor viewMore command", () => {
    it("Should register viewMore command", async () => {
      const mockNode = {
        fetchNextPage: jest.fn().mockResolvedValue(undefined),
      } as any;
      
      const registerCommandSpy = jest.spyOn(commands, "registerCommand");
      
      // Create new instance to trigger constructor
      const newTree = new CICSTree();
      
      expect(registerCommandSpy).toHaveBeenCalledWith(
        "cics-extension-for-zowe.viewMore",
        expect.any(Function)
      );
      
      // Get the registered callback
      const callback = registerCommandSpy.mock.calls.find(
        call => call[0] === "cics-extension-for-zowe.viewMore"
      )?.[1];
      
      if (callback) {
        const refreshSpy = jest.spyOn(newTree, "refresh").mockImplementation();
        await callback(mockNode);
        
        expect(mockNode.fetchNextPage).toHaveBeenCalled();
        expect(refreshSpy).toHaveBeenCalledWith(mockNode);
      }
    });
  });
});
