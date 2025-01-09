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

import * as vscode from "vscode";
import { FilterDescriptor } from "../utils/filterUtils";
import { findSelectedNodes } from "../utils/commandUtils";
import { getResource } from "@zowe/cics-for-zowe-sdk";
import { PersistentStorage } from "../utils/PersistentStorage";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";
import { openConfigFile } from "../utils/workspaceUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSSessionTree } from "./CICSSessionTree";
import * as https from "https";
import { getIconPathInResources, missingSessionParameters, promptCredentials } from "../utils/profileUtils";
import { Gui, imperative, FileManagement, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";

export class CICSTree implements vscode.TreeDataProvider<CICSSessionTree> {
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
    vscode.commands.executeCommand("workbench.actions.treeView.cics-view.collapseAll");
  }
  public clearLoadedProfiles() {
    this.loadedProfiles = [];
    this._onDidChangeTreeData.fire(undefined);
  }

  /**
     * Searches profiles stored in persistent storage, retrieves information for that profile from
     * ZE's PorfilesCache API and then creates CICSSessionTrees with this information and adds
     * these as children to the CICSTree (vscode.TreeDataProvider)
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
  async manageProfile(treeview: vscode.TreeView<any>, node: any) {
    const allSelectedNodes = findSelectedNodes(treeview, CICSSessionTree, node);
    if (!allSelectedNodes || !allSelectedNodes.length) {
      vscode.window.showErrorMessage("No profile selected to manage");
      return;
    }
    try {
      const configInstance = await ProfileManagement.getConfigInstance();
      if (configInstance.getTeamConfig().exists) {
        const currentProfile = await ProfileManagement.getProfilesCache().getProfileFromConfig(
          allSelectedNodes[allSelectedNodes.length - 1].label,
        );

        const deleteProfile: vscode.QuickPickItem = {
          label: `$(trash) ${vscode.l10n.t(`Delete Profile${allSelectedNodes.length > 1 ? "s" : ""}`)}`,
          description: vscode.l10n.t(`Delete the selected Profile${allSelectedNodes.length > 1 ? "s" : ""}`),
        };
        const hideProfile: vscode.QuickPickItem = {
          label: `$(eye-closed) ${vscode.l10n.t(`Hide Profile${allSelectedNodes.length > 1 ? "s" : ""}`)}`,
          description: vscode.l10n.t(`Hide the selected Profile${allSelectedNodes.length > 1 ? "s" : ""}`),
        };
        const editProfile: vscode.QuickPickItem = {
          label: `$(pencil) ${vscode.l10n.t(`Edit Profile${allSelectedNodes.length > 1 ? "s" : ""}`)}`,
          description: vscode.l10n.t(`Update the selected Profile${allSelectedNodes.length > 1 ? "s" : ""}`),
        };

        const quickpick = Gui.createQuickPick();
        const addProfilePlaceholder = "Choose user action for selected profiles";
        quickpick.items = [editProfile, hideProfile, deleteProfile];
        quickpick.placeholder = addProfilePlaceholder;
        quickpick.ignoreFocusOut = true;
        quickpick.show();
        const choice = await Gui.resolveQuickPick(quickpick);
        quickpick.hide();
        const debugMsg = vscode.l10n.t(`Profile selection has been cancelled.`);
        if (!choice) {
          Gui.showMessage(debugMsg);
          return;
        } else if (choice === hideProfile) {
          this.hideZoweConfigFile(allSelectedNodes);
          return;
        } else if (choice === editProfile) {
          for (const sessionTree of allSelectedNodes) {
            await this.updateSession(sessionTree, configInstance);
          }
        } else {
          const filePath = currentProfile.profLoc.osLoc[0];
          await openConfigFile(filePath);
          return;
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(
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
        const items: vscode.QuickPickItem[] = [];

        const profAllAttrs = profileInfo.getAllProfiles();
        for (const pName of allCICSProfileNames) {
          const osLocInfo = profileInfo.getOsLocInfo(profAllAttrs.find((p) => p.profName === pName));
          items.push(new FilterDescriptor(this.getProfileIcon(osLocInfo)[0] + " " + pName));
        }
        const quickpick = Gui.createQuickPick();
        const addProfilePlaceholder = vscode.l10n.t(`Choose "Create new..." to define or select a profile to add to the CICS tree`);
        quickpick.items = [configPick, configEdit, ...items];
        quickpick.placeholder = addProfilePlaceholder;
        quickpick.ignoreFocusOut = true;
        quickpick.show();
        const choice = await Gui.resolveQuickPick(quickpick);
        quickpick.hide();
        const debugMsg = vscode.l10n.t(`Profile selection has been cancelled.`);
        if (!choice) {
          Gui.showMessage(debugMsg);
          return;
        } else if (choice === configPick) {
          vscode.commands.executeCommand("zowe.all.config.init");
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
        vscode.commands.executeCommand("zowe.all.config.init");
      }
    } catch (error) {
      console.log(error);
      vscode.window.showErrorMessage(JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " "));
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
    vscode.window.withProgress(
      {
        title: "Load profile",
        location: vscode.ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          console.log(`Cancelling the loading of ${profile.name}`);
        });

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
                missingParamters = missingParamters.filter(
                  (param) => userPass.indexOf(param) === -1 || userPass.indexOf(param) === -1,
                );
              }
              if (missingParamters.length) {
                vscode.window.showInformationMessage(
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
          newSessionTree = new CICSSessionTree(profile, getIconPathInResources("profile-dark.svg", "profile-light.svg"));
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
              try {
                https.globalAgent.options.rejectUnauthorized = profile.profile.rejectUnauthorized;

                const regionsObtained = await getResource(session, {
                  name: "CICSRegion",
                  regionName: item.regions[0].applid,
                });
                // 200 OK received
                newSessionTree.setAuthorized();
                https.globalAgent.options.rejectUnauthorized = undefined;
                const newRegionTree = new CICSRegionTree(
                  item.regions[0].applid,
                  regionsObtained.response.records.cicsregion,
                  newSessionTree,
                  undefined,
                  newSessionTree,
                );
                newSessionTree.addRegion(newRegionTree);
              } catch (error) {
                https.globalAgent.options.rejectUnauthorized = undefined;
                console.log(error);
              }
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
          https.globalAgent.options.rejectUnauthorized = undefined;
          // Change session tree icon to disconnected upon error
          newSessionTree = new CICSSessionTree(
            profile,
            getIconPathInResources("profile-disconnected-dark.svg", "profile-disconnected-light.svg"),
          );
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
                  vscode.window.showErrorMessage(
                    `Error: connect ETIMEDOUT ${profile.profile.host}:${profile.profile.port} (${profile.name})`,
                  );
                  break;
                case "ENOTFOUND":
                  vscode.window.showErrorMessage(
                    `Error: getaddrinfo ENOTFOUND ${profile.profile.host}:${profile.profile.port} (${profile.name})`,
                  );
                  break;
                case "ECONNRESET":
                  vscode.window.showErrorMessage(
                    `Error: socket hang up ${profile.profile.host}:${profile.profile.port} (${profile.name})`,
                  );
                  break;
                case "EPROTO":
                  vscode.window.showErrorMessage(
                    `Error: write EPROTO ${profile.profile.host}:${profile.profile.port} (${profile.name})`,
                  );
                  break;
                case "DEPTH_ZERO_SELF_SIGNED_CERT":
                case "SELF_SIGNED_CERT_IN_CHAIN":
                case "ERR_TLS_CERT_ALTNAME_INVALID":
                case "CERT_HAS_EXPIRED":
                  // If re-expanding a profile that has an expired certificate
                  if (sessionTree) {
                    const decision = await vscode.window.showInformationMessage(
                      `Warning: Your connection is not private (${error.code}) - would you still like to proceed to ${profile.profile.host} (unsafe)?`,
                      ...["Yes", "No"],
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
                          updatedProfile = await ProfileManagement.getProfilesCache().loadNamedProfile(
                            profile.name,
                            "cics",
                          );
                        }
                        await this.removeSession(sessionTree, updatedProfile, position);
                      }
                    }
                  }
                  break;
                default:
                  vscode.window.showErrorMessage(
                    `Error: An error has occurred ${profile.profile.host}:${profile.profile.port} (${profile.name}) - ${JSON.stringify(
                      error,
                      Object.getOwnPropertyNames(error),
                    ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`,
                  );
              }
            } else if ("response" in error) {
              if (error.response !== "undefined" && error.response.status) {
                switch (error.response.status) {
                  case 401:
                    vscode.window.showErrorMessage(`Error: Request failed with status code 401 for Profile '${profile.name}'`);
                    // set the unauthorized flag to true for reprompting of credentials.
                    newSessionTree.setUnauthorized();
                    // Replace old profile tree with new disconnected profile tree item
                    this.loadedProfiles.splice(position, 1, newSessionTree);
                    break;
                  case 404:
                    vscode.window.showErrorMessage(
                      `Error: Request failed with status code 404 for Profile '${profile.name}' - Not Found`,
                    );
                    break;
                  case 500:
                    vscode.window.showErrorMessage(`Error: Request failed with status code 500 for Profile '${profile.name}'`);
                    break;
                  default:
                    vscode.window.showErrorMessage(
                      `Error: Request failed with status code ${error.response.status} for Profile '${profile.name}'`,
                    );
                }
              } else {
                vscode.window.showErrorMessage(
                  `Error: An error has occurred ${profile.profile.host}:${profile.profile.port} (${profile.name}) - ${JSON.stringify(
                    error,
                    Object.getOwnPropertyNames(error),
                  ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`,
                );
              }
            }
          }
          console.log(error);
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

  /**
     * Method for V1 profile configuration that provides UI for user to hide a selected profile.
     * @param allSelectedNodes array of selected nodes
     */
  async hideZoweConfigFile(allSelectedNodes: any[]) {
    for (const index in allSelectedNodes) {
      try {
        const currentNode = allSelectedNodes[parseInt(index)];
        await this.removeSession(currentNode);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Something went wrong when hiding the profile - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
            /(\\n\t|\\n|\\t)/gm,
            " ",
          )}`,
        );
      }
    }
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
     * Update profile functionality for V1 profile configuration
     * @param session CICSSessions Tree
     */
  async updateSession(session: CICSSessionTree, configInstance: imperative.ProfileInfo) {
    await ProfileManagement.profilesCacheRefresh();
    const profileCache = await ProfileManagement.getProfilesCache();
    const profileToUpdate = profileCache.loadNamedProfile(session.label?.toString()!, "cics");
    const currentProfile = await profileCache.getProfileFromConfig(profileToUpdate.name);
    const teamConfigFilePath = configInstance.getTeamConfig().opts.homeDir + "/zowe.config.json";
    const filePath = currentProfile?.profLoc.osLoc?.[0] ?? teamConfigFilePath;
    await openConfigFile(filePath);
  }

  /**
     * Method for V1 profile configuration that returns the context of a configuration file.
     * @param action string create or edit
     */
  private async getConfigLocationPrompt(action: string): Promise<string> {
    let placeHolderText: string;
    if (action === "create") {
      placeHolderText = vscode.l10n.t("Select the location where the config file will be initialized");
    } else {
      placeHolderText = vscode.l10n.t("Select the location of the config file to edit");
    }
    const quickPickOptions: vscode.QuickPickOptions = {
      placeHolder: placeHolderText,
      ignoreFocusOut: true,
      canPickMany: false,
    };
    const globalText = vscode.l10n.t("Global: in the Zowe home directory");
    const projectText = vscode.l10n.t("Project: in the current working directory");
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

  getTreeItem(element: CICSSessionTree): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: CICSSessionTree): vscode.ProviderResult<any[]> {
    return element === undefined ? this.loadedProfiles : element.children;
  }

  getParent(element: any): vscode.ProviderResult<any> {
    element.getParent();
  }

  public _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();
  readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;
}
