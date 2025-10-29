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
import { CICSTree } from "../trees";
import { ProfileManagement } from "../utils/profileManagement";
import { IProfileLoaded } from "@zowe/imperative";
import { Gui, ZoweVsCodeExtension, ZosEncoding } from "@zowe/zowe-explorer-api";
import * as vscode from "vscode";
import type { IZoweUSSTreeNode } from "@zowe/zowe-explorer-api";


export function doesConnectionSupportUSS(profile: IProfileLoaded) {
  try {
   ZoweVsCodeExtension.getZoweExplorerApi().getUssApi(profile);
    return true;
  } catch (ex) {
    // profile does not support JES API
  }
  return false;
}

async function promptUserForProfile(zosProfiles: IProfileLoaded[]): Promise<string> {
  const profileNames = zosProfiles.map((profile) => profile.name);

  if (profileNames.length === 0) {
    return null;
  }
  // ask the user to pick from the profiles passed in
  const quickPickOptions: vscode.QuickPickOptions = {
    placeHolder: vscode.l10n.t("Select a profile to access the logs"),
    ignoreFocusOut: true,
    canPickMany: false,
  };
  const chosenProfileName = await Gui.showQuickPick(profileNames, quickPickOptions);
  if (chosenProfileName === undefined) {
    return chosenProfileName;
  }
  // if the profile they picked doesn't have credentials, prompt the user for them
  const chosenProfileLoaded = zosProfiles.filter((profile) => profile.name === chosenProfileName)[0];
  const chosenProfile = chosenProfileLoaded.profile;
  if (!(chosenProfile.user || chosenProfile.certFile || chosenProfile.tokenValue)) {
    CICSLogger.debug(`Prompting for credentials for ${chosenProfileName}`);
    await ZoweVsCodeExtension.updateCredentials(
      {
        profile: chosenProfileLoaded,
        rePrompt: false,
      },
      ProfileManagement.getExplorerApis()
    );
  }
  // call fetchAllProfiles again otherwise we get an expect error about requiring a session to be defined
  const requestTheProfileAgain = (await ProfileManagement.getProfilesCache().fetchAllProfiles()).filter((prof) => prof.name === chosenProfileName)[0];
  return requestTheProfileAgain.name;
}


// fetching a base profile can throw an error if no nesting or base profile is available
export async function fetchBaseProfileWithoutError(profile: IProfileLoaded): Promise<IProfileLoaded | undefined> {
  let baseForProfile = undefined;
  try {
    baseForProfile = await ProfileManagement.getProfilesCache().fetchBaseProfile(profile.name);
  } catch (ex) {
    // no problem - no base profile, we'll return undefined
  }
  return baseForProfile;
}

export async function findRelatedZosProfiles(cicsProfile: IProfileLoaded, zosProfiles: IProfileLoaded[]): Promise<IProfileLoaded> {
  const baseForCicsProfile = await fetchBaseProfileWithoutError(cicsProfile);

  // sort profiles with zosmf ones first to make zosmf the default
  // also filter so we only automatically pick z/os connections that have credentials associated
  zosProfiles = zosProfiles.sort((prof) => (prof.profile.type === "zosmf" ? -1 : 1)).filter((prof) => prof.profile.user);

  // filter out profiles that are not in the same base as the cics profile
  const matchingProfiles: IProfileLoaded[] = [];
  if (baseForCicsProfile) {
    for (const profile of zosProfiles) {
      if (baseForCicsProfile && baseForCicsProfile.name === (await fetchBaseProfileWithoutError(profile))?.name) {
        matchingProfiles.push(profile);
      }
    }
  }
  if (matchingProfiles.length > 0) {
    CICSLogger.debug(`Located matching z/OS profile by base profile: ${matchingProfiles[0]?.name}`);
    return matchingProfiles[0];
  }

  // we couldn't find anything within a profile group
  // filter down to just profiles that have the same hostname as our cics connection
  const cicsHostProfile = zosProfiles.filter((profile) => cicsProfile.profile.host === profile.profile.host)[0];
  if (cicsHostProfile) {
    CICSLogger.debug(`Located matching z/OS profile by hostname ${cicsHostProfile?.name}`);
    return cicsHostProfile;
  }

  return undefined;
}


export function showBundleDirectory(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showBundleDirectory", async (node) => {
    const selectedBundle = node ?? treeview.selection[0];
    if (!selectedBundle) {
      window.showErrorMessage(`No Bundle is selected`);
      return;
    }

    CICSLogger.debug(`Showing bundle directory for ${selectedBundle.getLabel()}`);

    const bundleDir = selectedBundle.getContainedResource().resource.attributes?.bundledir;
    CICSLogger.debug(`Bundle Directory for bundle is : ${bundleDir}`);
    if (!bundleDir) {
      window.showErrorMessage(`Could not find bundle directory for ${selectedBundle.getLabel()}.`);
      return;
    }

    const allProfiles = await ProfileManagement.getProfilesCache().fetchAllProfiles();
    const zosProfiles = allProfiles.filter((element) => doesConnectionSupportUSS(element));
    let chosenProfileName: string;

    const matchingZosProfile = await findRelatedZosProfiles(selectedBundle.profile, zosProfiles);

    if (matchingZosProfile) {
      chosenProfileName = matchingZosProfile.name;
    } else {
      // we couldn't find a matching profile - prompt the user with all zos profiles
      chosenProfileName = await promptUserForProfile(zosProfiles);
      CICSLogger.debug(`User picked z/OS profile: ${chosenProfileName}`);
      if (chosenProfileName === null) {
        window.showErrorMessage("Could not find any profiles that will access JES (for instance z/OSMF).");
        return;
      } else if (chosenProfileName === undefined) {
        // the user cancelled the quick pick
        return;
      }
    }
    try {
      // Get the profile object from the name
      const chosenProfile = zosProfiles.find(profile => profile.name === chosenProfileName);
      if (!chosenProfile) {
        window.showErrorMessage(`Could not find profile ${chosenProfileName}`);
        return;
      }

      // Create a simple USS node with the minimum required properties
      // We'll use type assertion as we can't implement all interface methods
      const directoryName = bundleDir.split("/").pop() || bundleDir;
      const targetNode = {
        label: directoryName,
        fullPath: bundleDir,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue: "directory",
        // Add these properties to make it more compatible
        dirty: false,
        getLabel: () => directoryName,
        getParent: () => undefined as any,
        getChildren: async () => [] as IZoweUSSTreeNode[],
        getProfileName: () => chosenProfileName,
        getSessionNode: () => undefined as any,
        getSession: () => undefined as any,
        getProfile: () => chosenProfile,
        setProfileToChoice: (profileObj: any): void => undefined,
        setSessionToChoice: (sessionObj: any): void => undefined,
        // USS specific methods
        getBaseName: (): string => directoryName,
        getEncodingInMap: (): ZosEncoding => ({ kind: "text" }),
        updateEncodingInMap: (): void => undefined,
      } as unknown as IZoweUSSTreeNode;

      // Use Zowe's filter command with our node
      await commands.executeCommand("zowe.uss.filterBy", targetNode);

    } catch (error) {
      CICSLogger.error(`Failed to show bundle directory in USS view: ${error}`);
      window.showErrorMessage(`Unable to open bundle directory in USS view.`);
    }
  });
}

