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
import { commands, window } from "vscode";
import { CICSLogger } from "../utils/CICSLogger";
import { ProfileManagement } from "../utils/profileManagement";
import { IProfileLoaded } from "@zowe/imperative";
import * as vscode from "vscode";
import { ZoweExplorerApiType, type IZoweUSSTreeNode } from "@zowe/zowe-explorer-api";
import { doesProfileSupportConnectionType, findRelatedZosProfiles, promptUserForProfile } from "../utils/commandUtils";
/**
 * Creates a minimal USS tree node compatible with IZoweUSSTreeNode interface
 * 
 * @param path - The full path of the USS directory
 * @param profileName - The name of the profile to use
 * @param profile - The profile object
 * @returns A minimal implementation of IZoweUSSTreeNode
 */
function createUSSTreeNode(path: string, profileName: string, profile: IProfileLoaded): IZoweUSSTreeNode {
    const directoryName = path.split("/").pop() || path;
    return {
        label: directoryName,
        fullPath: path,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: "directory",
        getLabel: () => directoryName,
        getProfileName: () => profileName,
        getProfile: () => profile,

    } as IZoweUSSTreeNode;
}

/**
 * Creates a session node for USS explorer
 *
 * @param profileName - The name of the profile to use
 * @param profile - The profile object
 * @returns A session node object compatible with Zowe Explorer
 */
function createSessionNode(profileName: string, profile: IProfileLoaded) {
    const node: any = {
        label: profileName,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: "uss_session",
        profile: profile,
        getProfile: () => profile,
        getProfileName: () => profileName,
        getSession: () => {
            return {
                ISession: {}
            };
        },
        setProfileToChoice: () => {
        },
        setSessionToChoice: () => {
        },
        getParent: (): any => {
            return undefined;
        },
        getChildren: (): any[] => {
            return [];
        },
        getSessionNode: () => {
            return node;
        },
        getLabel: () => {
            return profileName;
        },
        openUSS: () => {
        },
        refreshUSS: () => {
        },
        getUSSDocumentFilePath: () => {
            return "";
        },
    };
    return node;
}

export function showBundleDirectory() {
    return commands.registerCommand("cics-extension-for-zowe.showBundleDirectory", async (selectedBundle) => {
        if (!selectedBundle) {
            window.showErrorMessage(`No CICS bundle is selected`);
            return;
        }
        const bundleDir = selectedBundle.getContainedResource()?.resource.attributes.bundledir;
        if (!bundleDir) {
            window.showErrorMessage(`Could not find bundle directory for ${selectedBundle.getContainedResourceName()
                }.`);
            return;
        }
        const allProfiles = await ProfileManagement.getProfilesCache().fetchAllProfiles();
        const zosProfiles = allProfiles.filter((element) => doesProfileSupportConnectionType(element, ZoweExplorerApiType.Uss));
        let chosenProfileName: string;
        const matchingZosProfile = await findRelatedZosProfiles(selectedBundle.profile, zosProfiles);
        if (matchingZosProfile) {
            chosenProfileName = matchingZosProfile.name;
        } else {
            // we couldn't find a matching profile - prompt the user with all zos profiles
            chosenProfileName = await promptUserForProfile(zosProfiles);
            if (!chosenProfileName) {
                // User cancelled the profile selection - exit quietly
                return;
            }
            CICSLogger.debug(`User picked z/OS profile: ${chosenProfileName}`);
        }
        try { // Get the profile object from the name
            const chosenProfile = zosProfiles.find(profile => profile.name === chosenProfileName);
            if (!chosenProfile) {
                window.showErrorMessage(`Could not find profile ${chosenProfileName}`);
                return;
            }
            const ussNode = createUSSTreeNode(bundleDir, chosenProfileName, chosenProfile);
            //If the selected profile is hidden, it should be loaded first
            try {
                const sessionNode = createSessionNode(chosenProfileName, chosenProfile);
                CICSLogger.info(`Executing command: zowe.uss.fullPath for ${bundleDir}`);
                await commands.executeCommand("zowe.uss.fullPath", sessionNode);
            } catch (error) {
                const message = String(error || "");
                if (message.includes(`Cannot resolve tree item for element 0/0:${chosenProfileName} from extension Zowe.vscode-extension-for-zowe`)) {
                    CICSLogger.debug(`Tree item resolution issue (expected): ${error}`);
                } else {
                    CICSLogger.error(`Failed to load USS session: ${error}`);
                }
            }
            await commands.executeCommand("zowe.uss.filterBy", ussNode);
        } catch (error) {
            window.showErrorMessage(`Unable to open bundle directory in USS view.`);
            CICSLogger.error(`Failed to open bundle directory in USS view: ${error}.`);
        }
    });
}