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
import {
  Event,
  EventEmitter,
  ProgressLocation,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  window,
  commands,
  TreeView
} from "vscode";
import { PersistentStorage } from "../utils/PersistentStorage";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";
import { isTheia, openConfigFile } from "../utils/workspaceUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSSessionTree } from "./CICSSessionTree";
import * as https from "https";
import { getIconPathInResources, missingSessionParameters, promptCredentials } from "../utils/profileUtils";
import { Gui, imperative, FileManagement, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";

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
     * Provides user with user actions and allows them to manage the selected profile
     * @param treeview CICSTree View
     * *@param node current selected node
     */
    async manageProfile(treeview: TreeView<any>, node: any) {
        const allSelectedNodes = findSelectedNodes(treeview, CICSSessionTree, node);
        if (!allSelectedNodes || !allSelectedNodes.length) {
            window.showErrorMessage("No profile selected to delete");
            return;
        }
        try {
            const configInstance = await ProfileManagement.getConfigInstance();
            if (configInstance.getTeamConfig().exists) {
                const currentProfile = await ProfileManagement.getProfilesCache().getProfileFromConfig(
                    allSelectedNodes[allSelectedNodes.length - 1].label,
                );

                const deleteProfile: vscode.QuickPickItem = {
                    label: `$(trash) ${vscode.l10n.t("Delete Profile")}`,
                    description: vscode.l10n.t("Delete the selected Profile"),
                };
                const hideProfile: vscode.QuickPickItem = {
                    label: `$(eye-closed) ${vscode.l10n.t("Hide Profile")}`,
                    description: vscode.l10n.t("Hide profile name from tree view"),
                };
                const editProfile: vscode.QuickPickItem = {
                    label: `$(pencil) ${vscode.l10n.t("Edit Profile")}`,
                    description: vscode.l10n.t("Update profile connection information"),
                };

                const quickpick = Gui.createQuickPick();
                let addProfilePlaceholder = "Choose profile action for " + currentProfile + " profile";
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
                    await this.hideZoweConfigFile(allSelectedNodes);
                    return;
                } else if (choice === editProfile) {
                    for (const sessionTree of allSelectedNodes) {
                        try {
                            await this.updateSession(sessionTree);
                        } catch (error) {
                            window.showErrorMessage(
                                `Something went wrong when updating the profile - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                                    /(\\n\t|\\n|\\t)/gm,
                                    " ",
                                )}`,
                            );
                            return;
                        }
                    }
                } else {
                    try {
                        const configInstance = await ProfileManagement.getConfigInstance();
                        if (configInstance.getTeamConfig().exists) {
                            const currentProfile = await ProfileManagement.getProfilesCache().getProfileFromConfig(
                                allSelectedNodes[allSelectedNodes.length - 1].label,
                            );
                            if (currentProfile) {
                                const filePath = currentProfile.profLoc.osLoc ? currentProfile.profLoc.osLoc[0] : "";
                                await openConfigFile(filePath);
                            }
                        } else {
                            await this.deleteSession(allSelectedNodes);
                        }
                    } catch (error) {
                        window.showErrorMessage(
                            `Something went wrong when deleting the profile - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                                /(\\n\t|\\n|\\t)/gm,
                                " ",
                            )}`,
                        );
                    }
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
                const items: vscode.QuickPickItem[] = [];

                const profAllAttrs = profileInfo.getAllProfiles();
                for (const pName of allCICSProfileNames) {
                    const osLocInfo = profileInfo.getOsLocInfo(profAllAttrs.find((p) => p.profName === pName));
                    items.push(new FilterDescriptor(this.getProfileIcon(osLocInfo)[0] + " " + pName));
                }
                const quickpick = Gui.createQuickPick();
                let addProfilePlaceholder = vscode.l10n.t(`Choose "Create new..." to define or select a profile to add to the CICS tree`);
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
                    await this.createNewProfile();
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
                this.createNewProfile();
            }
        } catch (error) {
            console.log(error);
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
                                    newSessionTree
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
                                            `Warning: Your connection is not private (${error.code}) - would you still like to proceed to ${profile.profile.host} (unsafe)?`,
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
                                                    // flip rejectUnauthorized to false
                                                    const message = {
                                                        name: profile.name,
                                                        profile: {
                                                            ...profile.profile,
                                                            rejectUnauthorized: false,
                                                        },
                                                    };
                                                    const newProfile = await ProfileManagement.updateProfile(message);
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
                                    case 401:
                                        window.showErrorMessage(`Error: Request failed with status code 401 for Profile '${profile.name}'`);
                                        // set the unauthorized flag to true for reprompting of credentials.
                                        newSessionTree.setUnauthorized();
                                        // Replace old profile tree with new disconnected profile tree item
                                        this.loadedProfiles.splice(position, 1, newSessionTree);
                                        break;
                                    case 404:
                                        window.showErrorMessage(`Error: Request failed with status code 404 for Profile '${profile.name}' - Not Found`);
                                        break;
                                    case 500:
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
                    console.log(error);
                }
            }
        );
    }

    /**
     * Method for V1 profile configuration that provides UI for user to enter profile details
     * and creates a profile.
     */
    async createNewProfile() {
        if (isTheia()) {
            const connnectionName = await Gui.showInputBox({
                prompt: "Name of connection",
                placeHolder: "e.g. my-cics-profile",
                ignoreFocusOut: true,
            });
            if (!connnectionName) {
                return;
            }
            const hostDetails = await Gui.showInputBox({
                prompt: "Input protocol, host and port for connection",
                placeHolder: "e.g. https://mycicshostname.com:12345",
                ignoreFocusOut: true,
            });

            if (!hostDetails) {
                return;
            }

            const splitHostDetails = hostDetails.split(":");

            const protocol = splitHostDetails[0].toLowerCase();
            if (!["http", "https"].includes(protocol)) {
                return;
            }

            let host = splitHostDetails[1];
            if (host.slice(0, 2) !== "//") {
                return;
            }
            host = host.slice(2);

            const port = parseInt(splitHostDetails[2]);
            if (!port || isNaN(port)) {
                return;
            }

            const username = await Gui.showInputBox({
                prompt: "Input Username",
                placeHolder: "e.g. user123",
                ignoreFocusOut: true,
            });
            if (!username) {
                return;
            }

            const userPassword = await Gui.showInputBox({
                prompt: "Input Password",
                placeHolder: "e.g. 12345678",
                password: true,
                ignoreFocusOut: true,
            });
            if (!userPassword) {
                return;
            }

            const plexName = await Gui.showInputBox({
                prompt: "Input Plex Name",
                placeHolder: "e.g. PLEX123",
                ignoreFocusOut: true,
            });

            const regionName = await Gui.showInputBox({
                prompt: "Input Region Name",
                placeHolder: "e.g. REGION123",
                ignoreFocusOut: true,
            });

            const rejectUnauthorized = await Gui.showQuickPick(["True", "False"], {
                placeHolder: "Reject Unauthorized",
                ignoreFocusOut: true,
            });
            if (!rejectUnauthorized) {
                return;
            }
            const message = {
                profile: {
                    name: connnectionName,
                    host: host,
                    port: port,
                    user: username,
                    password: userPassword,
                    rejectUnauthorized: rejectUnauthorized === "True" ? true : false,
                    protocol: protocol,
                    cicsPlex: plexName.length === 0 ? undefined : plexName,
                    regionName: regionName.length === 0 ? undefined : regionName,
                },
                name: connnectionName,
                type: "CICS",
                overwrite: true,
            };

            try {
                await ProfileManagement.createNewProfile(message);
                await ProfileManagement.profilesCacheRefresh();
                await this.loadProfile(ProfileManagement.getProfilesCache().loadNamedProfile(message.name, "cics"));
            } catch (error) {
                // @ts-ignore
                window.showErrorMessage(error);
            }
        } else {
            commands.executeCommand("zowe.all.config.init");
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
        label = label.split(/ (.*)/)[1];
        let profileToLoad;
        profileToLoad = await ProfileManagement.getProfilesCache().getLoadedProfConfig(label);
        const newSessionTree = new CICSSessionTree(profileToLoad);
        this.loadedProfiles.push(newSessionTree);
        console.debug(label);
        const persistentStorage = new PersistentStorage("zowe.cics.persistent");
        await persistentStorage.addLoadedCICSProfile(label);
        this._onDidChangeTreeData.fire(undefined);
    }

    /**
     * Method for V1 profile configuration that provides UI for user to hide a selected profile.
     * @param allSelectedNodes array of selected nodes
     */
    async hideZoweConfigFile(allSelectedNodes: any[]) {
        window.withProgress(
            {
                title: "Hide Profile",
                location: ProgressLocation.Notification,
                cancellable: true,
            },
            async (progress, token) => {
                token.onCancellationRequested(() => {
                    console.log("Cancelling the hide command");
                });
                for (const index in allSelectedNodes) {
                    progress.report({
                        message: `Hiding ${parseInt(index) + 1} of ${allSelectedNodes.length}`,
                        increment: (parseInt(index) / allSelectedNodes.length) * 100,
                    });
                    try {
                        const currentNode = allSelectedNodes[parseInt(index)];

                        await this.removeSession(currentNode);
                    } catch (error) {
                        window.showErrorMessage(
                            `Something went wrong when hiding the profile - ${JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(
                                /(\\n\t|\\n|\\t)/gm,
                                " ",
                            )}`,
                        );
                    }
                }
            },
        );
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
     * Delete profile functionality for V1 profile configuration
     * @param sessions
     */
    async deleteSession(sessions: CICSSessionTree[]) {
        let answer;
        if (sessions.length === 1) {
            answer = await window.showInformationMessage(
                `Are you sure you want to delete the profile "${sessions[0].label?.toString()!}"`,
                ...["Yes", "No"]
            );
        } else if (sessions.length > 1) {
            answer = await window.showInformationMessage(
                `Are you sure you want to delete the profiles "${sessions.map((sessionTree) => {
                    return sessionTree.label?.toString()!;
                })}"`,
                ...["Yes", "No"]
            );
        }
        if (answer === "Yes") {
            window.withProgress(
                {
                    title: "Delete Profile",
                    location: ProgressLocation.Notification,
                    cancellable: true,
                },
                async (progress, token) => {
                    token.onCancellationRequested(() => {
                        console.log("Cancelling the delete command");
                    });
                    for (const index in sessions) {
                        progress.report({
                            message: `Deleting profile ${parseInt(index) + 1} of ${sessions.length}`,
                            increment: (parseInt(index) / sessions.length) * 100,
                        });
                        try {
                            await ProfileManagement.deleteProfile({
                                name: sessions[parseInt(index)].label?.toString()!,
                                rejectIfDependency: true,
                            });
                            const persistentStorage = new PersistentStorage("zowe.cics.persistent");
                            await persistentStorage.removeLoadedCICSProfile(sessions[parseInt(index)].label.toString());

                            this.loadedProfiles = this.loadedProfiles.filter((profile) => profile !== sessions[parseInt(index)]);
                            this._onDidChangeTreeData.fire(undefined);
                        } catch (error) {
                            // @ts-ignore
                            window.showErrorMessage(error);
                        }
                    }
                }
            );
        }
    }

    /**
     * Update profile functionality for V1 profile configuration
     * @param session CICSSessions Tree
     */
    async updateSession(session: CICSSessionTree) {
        await ProfileManagement.profilesCacheRefresh();
        const profileCache = await ProfileManagement.getProfilesCache();
        const profileToUpdate = profileCache.loadNamedProfile(session.label?.toString()!, "cics");
        const currentProfile = await profileCache.getProfileFromConfig(profileToUpdate.name);
        await this.updateSessionHelper(currentProfile);
    }

    /**
     * Helper method to open file config for selected profile
     * @param profile instance of IProfAttrs
     */
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
