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
import { TreeView, commands, l10n, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSLogger } from "../utils/CICSLogger";
import { findProfileAndShowJobSpool, toArray } from "../utils/commandUtils";
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
      window.showErrorMessage(l10n.t("No region selected"));
      return;
    }
    CICSLogger.debug(`Showing region logs for region ${selectedRegion.getRegionName()}`);

    const jobid = await getJobIdForRegion(selectedRegion);
    CICSLogger.debug(`Job ID for region: ${jobid}`);
    if (!jobid) {
      window.showErrorMessage(l10n.t("Could not find Job ID for region {0}.", selectedRegion.region.cicsname));
      return;
    }

    await findProfileAndShowJobSpool(selectedRegion.parentSession.profile, jobid, selectedRegion.getRegionName());
  });
}
