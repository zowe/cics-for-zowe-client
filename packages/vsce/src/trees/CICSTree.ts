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

import { FilterDescriptor } from "../utils/filterUtils";
import { findSelectedNodes } from "../utils/commandUtils";
import { getResource } from "@zowe/cics-for-zowe-sdk";
import { Gui, imperative, FileManagement, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import {
  commands,
  Event,
  EventEmitter,
  ProgressLocation,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window,
  TreeView,
  QuickPickItem,
  l10n,
  QuickPickOptions,
} from "vscode";
import constants from "../utils/constants";
import { PersistentStorage } from "../utils/PersistentStorage";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";
import { missingSessionParameters, promptCredentials } from "../utils/profileUtils";
import { getIconFilePathFromName } from "../utils/iconUtils";
import { openConfigFile } from "../utils/workspaceUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSSessionTree } from "./CICSSessionTree";

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
    await ProfileManagement.profilesCacheRefresh();
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    const uniqueProfileNamesToLoad = [...new Set(persistentStorage.getLoadedCICSProfile())];

    this.loadedProfiles = uniqueProfileNamesToLoad.flatMap(
      (profileName: string) => {
        try {
          const profile = ProfileManagement.getProfilesCache().loadNamedProfile(profileName, "cics");
          return [new CICSSessionTree(profile)];
        } catch (error) {
          return [];
        }
      }
    );
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
          " ",
        )}`,
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
  async loadProfile(profile?: imperative.IProfileLoaded, position?: number | undefined, sessionTree?: CICSSessionTree) {
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    await persistentStorage.addLoadedCICSProfile(profile.name);
    let newSessionTree: CICSSessionTree;
    window.withProgress(
      {
        title: "Load profile",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });

        progress.report({
          message: `Loading ${profile.name}`,
        });
        try {
          const configInstance = await ProfileManagement.getConfigInstance();
          if (configInstance.getTeamConfig().exists) {
            let missingParamters = missingSessionParameters(profile.profile);
            if (missingParamters.length) {
              const userPass = ["user", "password"];
              if (missingParamters.includes(userPass[0]) || missingParamters.includes(userPass[1])) {
                const updatedProfile = await promptCredentials(profile.name, true);
                if (!updatedProfile) {
                  return;
                }
                profile = updatedProfile;
                // Remove "user" and "password" from missing params array
                missingParamters = missingParamters.filter((param) => userPass.indexOf(param) === -1);
              }
              if (missingParamters.length) {
                window.showInformationMessage(
                  `The following fields are missing from ${profile.name}: ${missingParamters.join(", ")}. Please update them in your config file.`,
                );
                return;
              }
              // If profile is expanded and it previously had 401 error code
            } else if (sessionTree && sessionTree.getIsUnauthorized()) {
              const updatedProfile = await promptCredentials(profile.name, true);
              if (!updatedProfile) {
                return;
              }
              profile = updatedProfile;
            }
          }
          const plexInfo: InfoLoaded[] = await ProfileManagement.getPlexInfo(profile);
          // Initialise session tree
          newSessionTree = new CICSSessionTree(profile, getIconFilePathFromName("profile"));
          // For each InfoLoaded object - happens if there are multiple plexes
          for (const item of plexInfo) {
            // No plex
            if (item.plexname === null) {
              const session = new imperative.Session({
                type: "basic",
                hostname: profile.profile.host,
                port: Number(profile.profile.port),
                user: profile.profile.user,
                password: profile.profile.password,
                rejectUnauthorized: profile.profile.rejectUnauthorized,
                protocol: profile.profile.protocol,
              });
              const regionsObtained = await getResource(session, {
                name: "CICSRegion",
                regionName: item.regions[0].applid,
              });
              // 200 OK received
              newSessionTree.setAuthorized();
              const newRegionTree = new CICSRegionTree(
                regionsObtained.response.records.cicsregion,
                newSessionTree,
                undefined,
                newSessionTree,
              );
              newSessionTree.addRegion(newRegionTree);
            } else {
              if (item.group) {
                const newPlexTree = new CICSPlexTree(item.plexname, profile, newSessionTree, profile.profile.regionName);
                newPlexTree.setLabel(`${item.plexname} - ${profile.profile.regionName}`);
                newSessionTree.addPlex(newPlexTree);
              } else {
                //Plex
                const newPlexTree = new CICSPlexTree(item.plexname, profile, newSessionTree);
                newSessionTree.addPlex(newPlexTree);
              }
            }
          }
          // If method was called when expanding profile
          if (sessionTree) {
            this.loadedProfiles.splice(position, 1, newSessionTree);
          }
          // If method was called when updating profile
          else if (position || position === 0) {
            this.loadedProfiles.splice(position, 0, newSessionTree);
          } else {
            this.loadedProfiles.push(newSessionTree);
          }
          this._onDidChangeTreeData.fire(undefined);
        } catch (error) {
          // Change session tree icon to disconnected upon error
          newSessionTree = new CICSSessionTree(profile, getIconFilePathFromName("profile-disconnected"));
          // If method was called when expanding profile
          if (sessionTree) {
            this.loadedProfiles.splice(position, 1, newSessionTree);
          }
          // If method was called when updating profile
          else if (position || position === 0) {
            this.loadedProfiles.splice(position, 0, newSessionTree);
          } else {
            this.loadedProfiles.push(newSessionTree);
          }
          this._onDidChangeTreeData.fire(undefined);

          if (typeof error === "object") {
            if ("code" in error) {
              switch (error.code) {
                case "ETIMEDOUT":
                  window.showErrorMessage(`Error: connect ETIMEDOUT ${profile.profile.host}:${profile.profile.port} (${profile.name})`);
                  break;
                case "ENOTFOUND":
                  window.showErrorMessage(`Error: getaddrinfo ENOTFOUND ${profile.profile.host}:${profile.profile.port} (${profile.name})`);
                  break;
                case "ECONNRESET":
                  window.showErrorMessage(`Error: socket hang up ${profile.profile.host}:${profile.profile.port} (${profile.name})`);
                  break;
                case "EPROTO":
                  window.showErrorMessage(`Error: write EPROTO ${profile.profile.host}:${profile.profile.port} (${profile.name})`);
                  break;
                case "DEPTH_ZERO_SELF_SIGNED_CERT":
                case "SELF_SIGNED_CERT_IN_CHAIN":
                case "ERR_TLS_CERT_ALTNAME_INVALID":
                case "CERT_HAS_EXPIRED":
                  // If re-expanding a profile that has an expired certificate
                  if (sessionTree) {
                    const decision = await window.showInformationMessage(
                      `Warning: Your connection is not private (${error.code}) - ` +
                      `would you still like to proceed to ${profile.profile.host} (unsafe)?`,
                      ...["Yes", "No"]
                    );
                    if (decision) {
                      if (decision === "Yes") {
                        const configInstance = await ProfileManagement.getConfigInstance();
                        let updatedProfile;
                        if (configInstance.getTeamConfig().exists) {
                          const upd = { profileName: profile.name, profileType: "cics" };
                          //   const configInstance = await ProfileManagement.getConfigInstance();
                          // flip rejectUnauthorized to false
                          await configInstance.updateProperty({ ...upd, property: "rejectUnauthorized", value: false });
                          updatedProfile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profile.name);
                        } else {
                          await ProfileManagement.profilesCacheRefresh();
                          updatedProfile = await ProfileManagement.getProfilesCache().loadNamedProfile(profile.name, "cics");
                        }
                        await this.removeSession(sessionTree, updatedProfile, position);
                      }
                    }
                  }
                  break;
                default:
                  window.showErrorMessage(
                    `Error: An error has occurred ${profile.profile.host}:${profile.profile.port} (${profile.name}) - ${JSON.stringify(
                      error,
                      Object.getOwnPropertyNames(error),
                    ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`,
                  );
              }
            } else if ("response" in error) {
              if (error.response !== "undefined" && error.response.status) {
                switch (error.response.status) {
                  case constants.HTTP_ERROR_UNAUTHORIZED:
                    window.showErrorMessage(`Error: Request failed with status code 401 for Profile '${profile.name}'`);
                    // set the unauthorized flag to true for reprompting of credentials.
                    newSessionTree.setUnauthorized();
                    // Replace old profile tree with new disconnected profile tree item
                    this.loadedProfiles.splice(position, 1, newSessionTree);
                    break;
                  case constants.HTTP_ERROR_NOT_FOUND:
                    window.showErrorMessage(`Error: Request failed with status code 404 for Profile '${profile.name}' - Not Found`);
                    break;
                  case constants.HTTP_ERROR_SERVER_ERROR:
                    window.showErrorMessage(`Error: Request failed with status code 500 for Profile '${profile.name}'`);
                    break;
                  default:
                    window.showErrorMessage(`Error: Request failed with status code ${error.response.status} for Profile '${profile.name}'`);
                }
              } else {
                window.showErrorMessage(
                  `Error: An error has occurred ${profile.profile.host}:${profile.profile.port} (${profile.name}) - ${JSON.stringify(
                    error,
                    Object.getOwnPropertyNames(error),
                  ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`,
                );
              }
            }
          }
        }
      },
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
    label = label.split(/ (.*)/)[1];
    const profileToLoad = await ProfileManagement.getProfilesCache().getLoadedProfConfig(label);
    const newSessionTree = new CICSSessionTree(profileToLoad);
    this.loadedProfiles.push(newSessionTree);
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    await persistentStorage.addLoadedCICSProfile(label);
    this._onDidChangeTreeData.fire(undefined);
  }

  async removeSession(session: CICSSessionTree, profile?: imperative.IProfileLoaded, position?: number) {
    const persistentStorage = new PersistentStorage("zowe.cics.persistent");
    await persistentStorage.removeLoadedCICSProfile(session.label.toString());
    this.loadedProfiles = this.loadedProfiles.filter((p) => p.profile.name !== session.label?.toString());
    if (profile && position !== undefined) {
      await this.loadProfile(profile, position);
    }
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
