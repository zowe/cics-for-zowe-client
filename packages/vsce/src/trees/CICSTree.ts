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

import { getResource } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import {
  commands,
  Event,
  EventEmitter,
  ProgressLocation,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window
} from "vscode";
import constants from "../utils/constants";
import { PersistentStorage } from "../utils/PersistentStorage";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";
import { missingSessionParameters, promptCredentials } from "../utils/profileUtils";
import { getIconPathInResources } from "../utils/iconUtils";
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
    commands.executeCommand('workbench.actions.treeView.cics-view.collapseAll');
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
   *
   * Provides user with prompts and allows them to add a profile after clicking the '+' button
   */
  async addProfile() {
    try {
      //const allCICSProfileNames = await ProfileManagement.getProfilesCache().getNamesForType('cics');
      const configInstance = await ProfileManagement.getConfigInstance();
      const allCICSProfiles = (await ProfileManagement.getProfilesCache().getProfileInfo()).getAllProfiles("cics");
      // const allCICSProfiles = await ProfileManagement.getProfilesCache().getProfiles('cics');
      const allCICSProfileNames: string[] = allCICSProfiles ? (allCICSProfiles.map((profile) => profile.profName) as unknown as [string]) : [];
      // No cics profiles needed beforhand for team config method
      if (configInstance.getTeamConfig().exists || allCICSProfileNames.length > 0) {
        const profileNameToLoad = await window.showQuickPick(
          [{ label: "\u270F Edit Team Configuration File" }].concat(
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
                return { label: profileName };
              })
          ),
          {
            ignoreFocusOut: true,
            placeHolder: "Edit Team Configuration File",
          }
        );
        if (profileNameToLoad) {
          // If Create New CICS Profile option chosen
          if (profileNameToLoad.label.includes("\u270F")) {
            // get all profiles of all types including zosmf
            const profiles = configInstance.getAllProfiles();
            const currentProfile =
              profiles.length > 0 ? await ProfileManagement.getProfilesCache().getProfileFromConfig(profiles[0].profName) : null;
            const teamConfigFilePath = configInstance.getTeamConfig().opts.homeDir + "/zowe.config.json";
            const filePath = currentProfile === null ? teamConfigFilePath : (currentProfile?.profLoc.osLoc?.[0] ?? teamConfigFilePath);
            await openConfigFile(filePath);
          } else {
            let profileToLoad;
            // TODO: Just use loadNamedProfile once the method is configured to v2 profiles
            if (configInstance.getTeamConfig().exists) {
              //ProfileManagement.getProfilesCache().loadNamedProfile(profileNameToLoad.label, 'cics');
              profileToLoad = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileNameToLoad.label);
            } else {
              await ProfileManagement.profilesCacheRefresh();
              profileToLoad = ProfileManagement.getProfilesCache().loadNamedProfile(profileNameToLoad.label, "cics");
            }
            const newSessionTree = new CICSSessionTree(profileToLoad);
            this.loadedProfiles.push(newSessionTree);
            const persistentStorage = new PersistentStorage("zowe.cics.persistent");
            await persistentStorage.addLoadedCICSProfile(profileNameToLoad.label);
            this._onDidChangeTreeData.fire(undefined);
          }
        }
      } else {
        //  Create New Profile Form should appear
        this.createNewProfile();
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
                missingParamters = missingParamters.filter((param) => userPass.indexOf(param) === -1 || userPass.indexOf(param) === -1);
              }
              if (missingParamters.length) {
                window.showInformationMessage(
                  `The following fields are missing from ${profile.name}: ${missingParamters.join(", ")}. Please update them in your config file.`
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
              const regionsObtained = await getResource(session, {
                name: "CICSRegion",
                regionName: item.regions[0].applid,
              });
              // 200 OK received
              newSessionTree.setAuthorized();
              const newRegionTree = new CICSRegionTree(
                item.regions[0].applid,
                regionsObtained.response.records.cicsregion,
                newSessionTree,
                undefined,
                newSessionTree
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
          newSessionTree = new CICSSessionTree(profile, getIconPathInResources("profile-disconnected-dark.svg", "profile-disconnected-light.svg"));
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
                      Object.getOwnPropertyNames(error)
                    ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`
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
                    Object.getOwnPropertyNames(error)
                  ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`
                );
              }
            }
          }
        }
      }
    );
  }

  /**
   * Method for V1 profile configuration that provides UI for user to enter profile details
   * and creates a profile.
   */
  async createNewProfile() {
    //  Initialize new team configuration file
    const response = await window.showQuickPick([{ label: "\uFF0B Create a New Team Configuration File" }], {
      ignoreFocusOut: true,
      placeHolder: "Create a New Team Configuration File",
    });
    if (response) {
      commands.executeCommand("zowe.all.config.init");
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


  async updateSession(session: CICSSessionTree) {
    await ProfileManagement.profilesCacheRefresh();
    const profileCache = await ProfileManagement.getProfilesCache();
    const profileToUpdate = profileCache.loadNamedProfile(session.label?.toString()!, "cics");
    const currentProfile = await profileCache.getProfileFromConfig(profileToUpdate.name);
    await this.updateSessionHelper(currentProfile);
  }

  async updateSessionHelper(profile: imperative.IProfAttrs) {
    const response = await window.showQuickPick([{ label: "\u270F Edit CICS Profile" }], {
      ignoreFocusOut: true,
      placeHolder: "Create a New Team Configuration File",
    });
    if (response) {
      const configInstance = await ProfileManagement.getConfigInstance();
      const teamConfigFilePath = configInstance.getTeamConfig().opts.homeDir + "/zowe.config.json";
      const filePath = profile?.profLoc.osLoc?.[0] ?? teamConfigFilePath;
      await openConfigFile(filePath);
    }
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
