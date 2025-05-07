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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { FileManagement, Gui, ZoweVsCodeExtension, imperative } from "@zowe/zowe-explorer-api";
import {
  Event,
  EventEmitter,
  ProgressLocation,
  ProviderResult,
  QuickPickItem,
  QuickPickOptions,
  TreeDataProvider,
  TreeItem,
  TreeView,
  commands,
  l10n,
  window,
} from "vscode";
import { PersistentStorage } from "../utils/PersistentStorage";
import constants from "../constants/CICS.defaults";
import { getErrorCode } from "../utils/errorUtils";
import { FilterDescriptor } from "../utils/filterUtils";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";
import { updateProfile } from "../utils/profileUtils";
import { runGetResource } from "../utils/resourceUtils";
import { openConfigFile } from "../utils/workspaceUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSSessionTree } from "./CICSSessionTree";
import { CICSLogger } from "../utils/CICSLogger";

export class CICSTree implements TreeDataProvider<CICSSessionTree> {
  loadedProfiles: CICSSessionTree[] = [];
  constructor() {
    this.loadStoredProfileNames();
  }
  public getLoadedProfiles() {
    return this.loadedProfiles;
  }

  public async refreshLoadedProfiles() {
    this.clearLoadedProfiles();
    await this.loadStoredProfileNames();
    commands.executeCommand("workbench.actions.treeView.cics-view.collapseAll");
  }
  public clearLoadedProfiles() {
    this.loadedProfiles = [];
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Searches profiles stored in persistent storage, retrieves information for that profile from
   * ZE's PorfilesCache API and then creates CICSSessionTrees with this information and adds
   * these as children to the CICSTree (TreeDataProvider)
   */
  public async loadStoredProfileNames() {
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    await ProfileManagement.profilesCacheRefresh();
    // Retrieve previously added profiles from persistent storage
    for (const profilename of persistentStorage.getLoadedCICSProfile()) {
      try {
        const profileToLoad = await ProfileManagement.getProfilesCache().loadNamedProfile(profilename, "cics");
        // avoid accidental repeats
        if (!this.loadedProfiles.filter((sessionTree) => sessionTree.label === profilename).length) {
          const newSessionTree = new CICSSessionTree(profileToLoad);
          this.loadedProfiles.push(newSessionTree);
        }
      } catch {
        continue;
      }
    }
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Provides user with user actions and allows them to manage the selected profile
   * @param treeview CICSTree View
   * *@param node current selected node
   */
  async manageProfile(treeview: TreeView<any>, node: CICSSessionTree) {
    try {
      const configInstance = await ProfileManagement.getConfigInstance();
      if (configInstance.getTeamConfig().exists) {
        const currentProfile = await ProfileManagement.getProfilesCache().getProfileFromConfig(String(node.label));

        const deleteProfile: QuickPickItem = {
          label: `$(trash) ${l10n.t(`Delete Profile`)}`,
          description: l10n.t(`Delete the selected Profile`),
        };
        const hideProfile: QuickPickItem = {
          label: `$(eye-closed) ${l10n.t(`Hide Profile`)}`,
          description: l10n.t(`Hide the selected Profile`),
        };
        const editProfile: QuickPickItem = {
          label: `$(pencil) ${l10n.t(`Edit Profile`)}`,
          description: l10n.t(`Update the selected Profile`),
        };

        const quickpick = Gui.createQuickPick();
        const addProfilePlaceholder = "Choose user action for selected profile";
        quickpick.items = [editProfile, hideProfile, deleteProfile];
        quickpick.placeholder = addProfilePlaceholder;
        quickpick.ignoreFocusOut = true;
        quickpick.show();
        const choice = await Gui.resolveQuickPick(quickpick);
        quickpick.hide();
        const debugMsg = l10n.t(`Profile selection has been cancelled.`);
        if (!choice) {
          Gui.showMessage(debugMsg);
          return;
        } else if (choice === hideProfile) {
          await this.removeSession(node);
          return;
        } else {
          // editProfile or deleteProfile
          const filePath = currentProfile.profLoc.osLoc[0];
          await openConfigFile(filePath);
          return;
        }
      }
    } catch (error) {
      window.showErrorMessage(
        `Something went wrong while managing the profile - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
          /(\\n\t|\\n|\\t)/gm,
          " "
        )}`
      );
    }
  }

  /**
   *
   * Provides user with prompts and allows them to add a profile after clicking the '+' button
   */
  async addProfile() {
    try {
      //const allCICSProfileNames = await ProfileManagement.getProfilesCache().getNamesForType('cics');
      const configInstance = await ProfileManagement.getConfigInstance();
      const profileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
      const allCICSProfiles = profileInfo.getAllProfiles("cics");
      // const allCICSProfiles = await ProfileManagement.getProfilesCache().getProfiles('cics');
      const allCICSProfileNames: string[] = allCICSProfiles ? (allCICSProfiles.map((profile) => profile.profName) as unknown as [string]) : [];
      // No cics profiles needed beforhand for team config method
      if (configInstance.getTeamConfig().exists || allCICSProfileNames.length > 0) {
        const createNewConfig = "Create a New Team Configuration File";
        const editConfig = "Edit Team Configuration File";

        const configPick = new FilterDescriptor("\uFF0B " + createNewConfig);
        const configEdit = new FilterDescriptor("\u270F " + editConfig);
        const items: QuickPickItem[] = [];

        const profAllAttrs = profileInfo.getAllProfiles();
        allCICSProfileNames
          .filter((name) => {
            for (const loadedProfile of this.loadedProfiles) {
              if (loadedProfile.label === name) {
                return false;
              }
            }
            return true;
          })
          .map((profileName) => {
            const osLocInfo = profileInfo.getOsLocInfo(profAllAttrs.find((p) => p.profName === profileName));
            items.push(new FilterDescriptor(this.getProfileIcon(osLocInfo)[0] + " " + profileName));
            return { label: profileName };
          });

        const quickpick = Gui.createQuickPick();
        const addProfilePlaceholder = l10n.t(`Choose "Create new..." to define or select a profile to add to the CICS tree`);
        quickpick.items = [configPick, configEdit, ...items];
        quickpick.placeholder = addProfilePlaceholder;
        quickpick.ignoreFocusOut = true;
        quickpick.show();
        const choice = await Gui.resolveQuickPick(quickpick);
        quickpick.hide();
        const debugMsg = l10n.t(`Profile selection has been cancelled.`);
        if (!choice) {
          Gui.showMessage(debugMsg);
          return;
        } else if (choice === configPick) {
          commands.executeCommand("zowe.all.config.init");
          return;
        } else if (choice === configEdit) {
          await this.editZoweConfigFile();
          return;
        } else {
          await this.loadExistingProfile(choice.label);
          return;
        }
      } else {
        //  Create New Profile Form should appear
        commands.executeCommand("zowe.all.config.init");
      }
    } catch (error) {
      window.showErrorMessage(JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " "));
    }
  }

  /**
   *
   * @param profile
   * @param position number that's passed in when updating or expanding profile - needed
   * to replace position of current CICSSessionTree.
   * @param sessionTree current CICSSessionTree only passed in if expanding a profile
   */
  async loadProfile(profile: imperative.IProfileLoaded, sessionTree: CICSSessionTree) {
    CICSLogger.debug(`Loading CICS profile [${profile.name}]`);

    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    await persistentStorage.addLoadedCICSProfile(profile.name);

    window.withProgress(
      {
        title: "Load profile",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        progress.report({
          message: `Loading ${profile.name}`,
        });
        try {
          const configInstance = await ProfileManagement.getConfigInstance();
          if (configInstance.getTeamConfig().exists) {
            // Initialise session tree
            let plexInfo: InfoLoaded[];
            try {
              plexInfo = await ProfileManagement.getPlexInfo(profile, sessionTree.getSession());
              sessionTree.setAuthorized();
            } catch (error) {
              if (getErrorCode(error) === constants.HTTP_ERROR_UNAUTHORIZED) {
                sessionTree.setUnauthorized();
                profile = await updateProfile(profile, sessionTree);

                if (!profile) {
                  throw error;
                }

                sessionTree.profile = profile;
                sessionTree.createSessionFromProfile();
                plexInfo = await ProfileManagement.getPlexInfo(profile, sessionTree.getSession());
                sessionTree.setAuthorized();
              } else {
                throw error;
              }
            }

            // For each InfoLoaded object - happens if there are multiple plexes
            sessionTree.clearChildren();
            for (const item of plexInfo) {
              // No plex
              if (item.plexname === null) {
                const regionsObtained = await runGetResource({
                  session: sessionTree.getSession(),
                  resourceName: CicsCmciConstants.CICS_CMCI_REGION,
                  regionName: item.regions[0].applid,
                });

                // 200 OK received
                const newRegionTree = new CICSRegionTree(
                  item.regions[0].applid,
                  regionsObtained.response.records.cicsregion,
                  sessionTree,
                  undefined,
                  sessionTree
                );
                sessionTree.addRegion(newRegionTree);
              } else {
                if (item.group) {
                  const newPlexTree = new CICSPlexTree(item.plexname, profile, sessionTree, profile.profile.regionName);
                  newPlexTree.setLabel(`${item.plexname} - ${profile.profile.regionName}`);
                  sessionTree.addPlex(newPlexTree);
                } else {
                  //Plex
                  const newPlexTree = new CICSPlexTree(item.plexname, profile, sessionTree);
                  sessionTree.addPlex(newPlexTree);
                }
              }
            }
            this._onDidChangeTreeData.fire(undefined);
          }
        } catch (error) {
          sessionTree.setUnauthorized();
          sessionTree.setIsExpanded(false);
          this._onDidChangeTreeData.fire(undefined);
        }
      }
    );
  }

  /**
   * Allows user to edit a configuration file based on global or project level context
   */
  async editZoweConfigFile() {
    let rootPath = FileManagement.getZoweDir();
    const workspaceDir = ZoweVsCodeExtension.workspaceRoot;
    const choice = await this.getConfigLocationPrompt("edit");
    if (choice === "global") {
      await openConfigFile(rootPath + "/zowe.config.json");
    } else if (choice === "project") {
      rootPath = workspaceDir.uri.fsPath;
      await openConfigFile(rootPath + "/zowe.config.json");
    } else {
      return;
    }
  }

  /**
   * Allows user to load an existing file from persistance area instead of creating a new profile.
   * @param label name of the selected profile
   */
  async loadExistingProfile(label: string) {
    CICSLogger.debug(`Loading existing profile [${label}]`);

    label = label.split(/ (.*)/)[1];
    const profileToLoad = await ProfileManagement.getProfilesCache().getLoadedProfConfig(label);
    const newSessionTree = new CICSSessionTree(profileToLoad);
    this.loadedProfiles.push(newSessionTree);
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    await persistentStorage.addLoadedCICSProfile(label);
    this._onDidChangeTreeData.fire(undefined);
  }

  async removeSession(session: CICSSessionTree) {
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    await persistentStorage.removeLoadedCICSProfile(session.label.toString());
    this.loadedProfiles = this.loadedProfiles.filter((p) => p.profile.name !== session.label?.toString());
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Method for profile configuration that returns the context of a configuration file.
   * @param action string create or edit
   */
  private async getConfigLocationPrompt(action: string): Promise<string> {
    let placeHolderText: string;
    if (action === "create") {
      placeHolderText = l10n.t("Select the location where the config file will be initialized");
    } else {
      placeHolderText = l10n.t("Select the location of the config file to edit");
    }
    const quickPickOptions: QuickPickOptions = {
      placeHolder: placeHolderText,
      ignoreFocusOut: true,
      canPickMany: false,
    };
    const globalText = l10n.t("Global: in the Zowe home directory");
    const projectText = l10n.t("Project: in the current working directory");
    const location = await Gui.showQuickPick([globalText, projectText], quickPickOptions);
    // call check for existing and prompt here
    switch (location) {
      case globalText:
        return "global";
      case projectText:
        return "project";
    }
  }

  /**
   * Method that returns the icon based on global or local context.
   * @param osLocInfo physical location of of profile on OS
   */
  private getProfileIcon(osLocInfo: imperative.IProfLocOsLoc[]): string[] {
    const ret: string[] = [];
    for (const loc of osLocInfo ?? []) {
      if (loc.global) {
        ret.push("$(home)");
      } else {
        ret.push("$(folder)");
      }
    }
    return ret;
  }

  getTreeItem(element: CICSSessionTree): TreeItem | Thenable<TreeItem> {
    return element;
  }
  getChildren(element?: CICSSessionTree): ProviderResult<any[]> {
    return element === undefined ? this.loadedProfiles : element.children;
  }

  getParent(element: any): ProviderResult<any> {
    element.getParent();
  }

  public _onDidChangeTreeData: EventEmitter<any | undefined> = new EventEmitter<any | undefined>();
  readonly onDidChangeTreeData: Event<any | undefined> = this._onDidChangeTreeData.event;
}
