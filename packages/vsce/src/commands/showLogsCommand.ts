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
import { IProfileLoaded } from "@zowe/imperative";
import { Gui, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import * as vscode from "vscode";
import { TreeView, commands, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSLogger } from "../utils/CICSLogger";
import { toArray } from "../utils/commandUtils";
import { ProfileManagement } from "../utils/profileManagement";
import { runGetResource } from "../utils/resourceUtils";

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

export async function getJobIdForRegion(selectedRegion: CICSRegionTree): Promise<string> {
  // when we have a CICSRGN table we have jobid, but not when we have a
  // MAS table. we get either CICSRGN or MAS depending on where we are in the
  // tree. request CICSRGN if jobid isn't available.
  let jobid: string = selectedRegion.region.jobid;
  if (!jobid) {
    try {
      const { response } = await runGetResource({
        profileName: selectedRegion.getProfile().name,
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        regionName: selectedRegion.region.cicsname,
        cicsPlex: selectedRegion.parentPlex?.plexName,
      });
      if (response.records?.cicsregion) {
        jobid = toArray(response.records.cicsregion)[0].jobid;
      }
    } catch (ex) {
      // unlikely to get here but logging this would be useful in future
    }
  }
  return jobid;
}

export function doesConnectionSupportJes(profile: IProfileLoaded) {
  try {
    ZoweVsCodeExtension.getZoweExplorerApi().getJesApi(profile);
    return true;
  } catch (ex) {
    // profile does not support JES API
  }
  return false;
}

export function getShowRegionLogs(treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showRegionLogs", async (node: CICSRegionTree) => {
    const selectedRegion = node ?? treeview.selection[0];
    if (!selectedRegion) {
      window.showErrorMessage(`No region selected`);
      return;
    }
    CICSLogger.debug(`Showing region logs for region ${selectedRegion.getRegionName()}`);

    const jobid = await getJobIdForRegion(selectedRegion);
    CICSLogger.debug(`Job ID for region: ${jobid}`);
    if (!jobid) {
      window.showErrorMessage(`Could not find Job ID for region ${selectedRegion.region.cicsname}.`);
      return;
    }

    const allProfiles = await ProfileManagement.getProfilesCache().fetchAllProfiles();
    // do not include the FTP profile because it doesn't support spools for running jobs.
    const zosProfiles = allProfiles.filter((element) => !["zftp"].includes(element.type) && doesConnectionSupportJes(element));

    let chosenProfileName: string;

    // find profiles that match by base profile or hostname, and have valid credentials
    const matchingZosProfile = await findRelatedZosProfiles(selectedRegion.parentSession.profile, zosProfiles);
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

    CICSLogger.info(`Calling zowe.jobs.setJobSpool for region ${selectedRegion?.getRegionName()}: ${chosenProfileName} / ${jobid}`);
    commands.executeCommand("zowe.jobs.setJobSpool", chosenProfileName, jobid);
  });
}
