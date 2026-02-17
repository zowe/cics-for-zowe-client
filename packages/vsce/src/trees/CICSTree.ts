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

import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import type { IProfileLoaded } from "@zowe/imperative";
import { FileManagement, Gui, ZoweVsCodeExtension, type imperative } from "@zowe/zowe-explorer-api";
import {
  type Event,
  EventEmitter,
  type ProviderResult,
  type QuickPickItem,
  type QuickPickOptions,
  type TreeDataProvider,
  type TreeItem,
  type TreeView,
  commands,
  l10n,
  window,
} from "vscode";
import { SessionHandler } from "../resources";
import { CICSLogger } from "../utils/CICSLogger";
import PersistentStorage from "../utils/PersistentStorage";
import { FilterDescriptor } from "../utils/filterUtils";
import { ProfileManagement } from "../utils/profileManagement";
import { openConfigFile } from "../utils/workspaceUtils";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { CICSSessionTree } from "./CICSSessionTree";

export class CICSTree implements TreeDataProvider<CICSSessionTree> {
  loadedProfiles: CICSSessionTree[] = [];
  constructor() {
    commands.registerCommand("cics-extension-for-zowe.viewMore", async (node: CICSResourceContainerNode<IResource>) => {
      await node.fetchNextPage();
      this.refresh(node);
    });
    this.loadStoredProfileNames();
  }
  public getLoadedProfiles() {
    return this.loadedProfiles;
  }

  public getSessionNodeForProfile(profile: IProfileLoaded) {
    return this.getLoadedProfiles().find((sessionNode) => sessionNode.getProfile() === profile);
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
    await ProfileManagement.profilesCacheRefresh();
    // Retrieve previously added profiles from persistent storage
    for (const profilename of PersistentStorage.getLoadedCICSProfiles()) {
      try {
        const profileToLoad = ProfileManagement.getProfilesCache().loadNamedProfile(profilename, "cics");
        // avoid accidental repeats
        if (!this.loadedProfiles.filter((sessionTree) => sessionTree.label === profilename).length) {
          const newSessionTree = new CICSSessionTree(profileToLoad, this);
          this.loadedProfiles.push(newSessionTree);
        }
      } catch (error) {
        if (error.message?.includes("Could not find profile named")) {
          await PersistentStorage.removeLoadedCICSProfile(profilename);
          const keysToRemove = PersistentStorage.getCriteriaKeysForSession(profilename);
          keysToRemove.map(async (k: string) => PersistentStorage.setCriteria(k));
        }
        continue;
      }
    }
    this.loadedProfiles.sort((a, b) => a.label.toString().localeCompare(b.label.toString()));
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
   * Provides user with user actions and allows them to manage the selected profile
   * @param treeview CICSTree View
   * *@param node current selected node
   */
  async manageProfile(node: CICSSessionTree) {
    try {
      const configInstance = await ProfileManagement.getConfigInstance();
      if (configInstance.getTeamConfig().exists) {
        const loadedProfile = ProfileManagement.getProfilesCache().loadNamedProfile(node.getProfile().name);
        const profileAttributes = await ProfileManagement.getProfilesCache().getProfileFromConfig(loadedProfile.name, loadedProfile.type);

        const updateCreds: QuickPickItem = {
          label: `$(refresh) ${l10n.t(`Update Credentials`)}`,
          description: l10n.t(`Update the selected profile's credentials`),
        };
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
        const addProfilePlaceholder = l10n.t("Choose user action for selected profile");
        quickpick.items = [updateCreds, editProfile, hideProfile, deleteProfile];
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
        } else if (choice === updateCreds) {
          const updatedProfile = await ZoweVsCodeExtension.updateCredentials(
            {
              profile: loadedProfile,
              rePrompt: true,
            },
            ProfileManagement.getExplorerApis()
          );
          if (updatedProfile) {
            node.setProfile(updatedProfile);
            SessionHandler.getInstance().removeProfile(updatedProfile.name);
            SessionHandler.getInstance().removeSession(updatedProfile.name);
            SessionHandler.getInstance().getSession(updatedProfile);
            Gui.showMessage(l10n.t("Credentials updated for profile {0}", updatedProfile.name));

            node.reset();
            node.requiresIconUpdate = true;
            this.refresh();

            return;
          }
        } else {
          // editProfile or deleteProfile
          const filePath = profileAttributes.profLoc.osLoc[0];
          await openConfigFile(filePath);
          return;
        }
      }
    } catch (error) {
      window.showErrorMessage(
        l10n.t(
          "Something went wrong while managing the profile - {0}",
          JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " ")
        )
      );
    }
  }

  /**
   *
   * Provides user with prompts and allows them to add a profile after clicking the '+' button
   */
  async addProfile() {
    try {
      const configInstance = await ProfileManagement.getConfigInstance();
      const profileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
      const allCICSProfiles = profileInfo.getAllProfiles("cics");
      const allCICSProfileNames: string[] = allCICSProfiles ? (allCICSProfiles.map((profile) => profile.profName) as unknown as [string]) : [];
      // No cics profiles needed beforhand for team config method
      if (configInstance.getTeamConfig().exists || allCICSProfileNames.length > 0) {
        const createNewConfig = l10n.t("Create a New Team Configuration File");
        const editConfig = l10n.t("Edit Team Configuration File");

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
    const newSessionTree = new CICSSessionTree(profileToLoad, this);
    this.loadedProfiles.push(newSessionTree);
    this.loadedProfiles.sort((a, b) => a.label.toString().localeCompare(b.label.toString()));
    await PersistentStorage.appendLoadedCICSProfile(label);
    this._onDidChangeTreeData.fire(undefined);
  }

  async removeSession(session: CICSSessionTree) {
    await PersistentStorage.removeLoadedCICSProfile(session.label.toString());
    this.loadedProfiles = this.loadedProfiles.filter((p) => p.getProfile().name !== session.label?.toString());
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
    return element === undefined ? this.loadedProfiles : element.getChildren();
  }

  getParent(element: any): ProviderResult<any> {
    element.getParent();
  }

  public _onDidChangeTreeData: EventEmitter<any | undefined> = new EventEmitter<any | undefined>();
  readonly onDidChangeTreeData: Event<any | undefined> = this._onDidChangeTreeData.event;

  refresh(node?: TreeItem) {
    this._onDidChangeTreeData.fire(node);
  }

  hookCollapseWatcher(view: TreeView<TreeItem>) {
    view.onDidCollapseElement(async (e) => {
      if (e.element instanceof CICSResourceContainerNode) {
        await e.element.reset();
        this.refresh(e.element);
      }
    });
  }
}
