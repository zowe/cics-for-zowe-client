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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { TreeView, commands, l10n, window } from "vscode";
import { SessionHandler } from "../resources/SessionHandler";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { CICSLogger } from "../utils/CICSLogger";
import { findProfileAndShowJobSpool, toArray } from "../utils/commandUtils";
import { runGetResource } from "../utils/resourceUtils";

export async function getJobIdForRegion(selectedRegion: CICSRegionTree | CICSResourceContainerNode<IResource>): Promise<string> {
  // when we have a CICSRGN table we have jobid, but not when we have a
  // MAS table. we get either CICSRGN or MAS depending on where we are in the
  // tree. request CICSRGN if jobid isn't available.
  let jobid: string | undefined;
  let profileName: string;
  let regionName: string;
  let cicsPlex: string | undefined;

  if (selectedRegion instanceof CICSRegionTree) {
    // Handle CICSRegionTree
    jobid = selectedRegion.region.jobid;
    profileName = selectedRegion.getProfile().name;
    regionName = selectedRegion.region.cicsname;
    cicsPlex = selectedRegion.parentPlex?.plexName;
  } else {
    // Handle CICSResourceContainerNode
    profileName = selectedRegion.getProfile().name;
    regionName = selectedRegion.regionName;
    cicsPlex = selectedRegion.cicsplexName;
  }

  if (!jobid) {
    try {
      const { response } = await runGetResource({
        profileName,
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        regionName,
        cicsPlex,
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
  return commands.registerCommand("cics-extension-for-zowe.showRegionLogs", async (node: CICSRegionTree | CICSResourceContainerNode<IResource>) => {
    // Handle both CICSRegionTree (from tree view) and CICSResourceContainerNode (from Resource Inspector)
    const selectedRegion = node instanceof CICSRegionTree ? (node ?? treeview.selection[0]) : node;

    if (!selectedRegion) {
      window.showErrorMessage(l10n.t("No region selected"));
      return;
    }

    const regionName = selectedRegion instanceof CICSRegionTree ? selectedRegion.getRegionName() : selectedRegion.regionName;
    CICSLogger.debug(`Showing region logs for region ${regionName}`);

    const jobid = await getJobIdForRegion(selectedRegion);

    CICSLogger.debug(`Job ID for region: ${jobid}`);
    if (!jobid) {
      window.showErrorMessage(l10n.t("Could not find Job ID for region {0}.", regionName));
      return;
    }

    const profileName = selectedRegion.getProfile().name;
    const profile = await SessionHandler.getInstance().getProfile(profileName);
    await findProfileAndShowJobSpool(profile, jobid, regionName);
  });
}
