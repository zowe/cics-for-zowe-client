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

import { commands, TreeView, window } from "vscode";
import { CICSLogger } from "../utils/CICSLogger";
import { ProfileManagement } from "../utils/profileManagement";
import { IProfileLoaded } from "@zowe/imperative";
import * as vscode from "vscode";
import type { IZoweUSSTreeNode }
    from "@zowe/zowe-explorer-api";
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
        getChildren: async () => [] as IZoweUSSTreeNode[],
        getProfileName: () => profileName,
        getProfile: () => profile,

    } as any as IZoweUSSTreeNode;
}


export function showBundleDirectory(treeview: TreeView<any>) {
    return commands.registerCommand("cics-extension-for-zowe.showBundleDirectory", async (selectedBundle) => {
        if (!selectedBundle) {
            window.showErrorMessage(`No Bundle is selected from cics tree`);
            return;
        }
        const bundleDir = selectedBundle.getContainedResource().resource.attributes?.bundledir;
        if (!bundleDir) {
            window.showErrorMessage(`Could not find bundle directory for ${selectedBundle.getLabel()
                }.`);
            return;
        }
        const allProfiles = await ProfileManagement.getProfilesCache().fetchAllProfiles();
        const zosProfiles = allProfiles.filter((element) => doesProfileSupportConnectionType(element, "uss"));
        let chosenProfileName: string;

        const matchingZosProfile = await findRelatedZosProfiles(selectedBundle.profile, zosProfiles);

        if (matchingZosProfile) {
            chosenProfileName = matchingZosProfile.name;
        } else { // we couldn't find a matching profile - prompt the user with all zos profiles
            chosenProfileName = await promptUserForProfile(zosProfiles);
            CICSLogger.debug(`User picked z/OS profile: ${chosenProfileName}`);
            if (chosenProfileName === null) {
                window.showErrorMessage("Could not find any profiles that will access USS (for instance z/OSMF).");
                return;
            } else if (chosenProfileName === undefined) { // the user cancelled the quick pick
                return;
            }
        }
        try { // Get the profile object from the name
            const chosenProfile = zosProfiles.find(profile => profile.name === chosenProfileName);
            if (!chosenProfile) {
                window.showErrorMessage(`Could not find profile ${chosenProfileName}`);
                return;
            }
            const ussNode = createUSSTreeNode(bundleDir, chosenProfileName, chosenProfile);
            await commands.executeCommand("zowe.uss.filterBy", ussNode);

        } catch (error) {
            CICSLogger.error(`Failed to show bundle directory in USS view: ${error}`);
            window.showErrorMessage(`Unable to open bundle directory in USS view.`);
        }
    });
}
