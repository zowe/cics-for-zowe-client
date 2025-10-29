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
import { TreeView, commands, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSLogger } from "../utils/CICSLogger";
import { doesProfileSupportConnectionType, findRelatedZosProfiles, promptUserForProfile, toArray } from "../utils/commandUtils";
import { ProfileManagement } from "../utils/profileManagement";
import { runGetResource } from "../utils/resourceUtils";

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
    const zosProfiles = allProfiles.filter((element) => !["zftp"].includes(element.type) && doesProfileSupportConnectionType(element, "jes"));

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
