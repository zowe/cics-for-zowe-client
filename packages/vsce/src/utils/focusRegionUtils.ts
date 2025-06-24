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

import { Gui } from "@zowe/zowe-explorer-api";
import { ConfigurationTarget, l10n, workspace } from "vscode";
import { SessionHandler } from "../resources";
import { InfoLoaded, ProfileManagement } from "./profileManagement";

// export interface IFocusRegionSettings {
//   regionName: string;
//   cicsPlex: string;
//   profileName: string;
// }

export async function getFocusRegionFromSettings(): Promise<{ profileName: string; focusSelectedRegion: string; cicsPlex: string }> {
  const config = workspace.getConfiguration("zowe.cics.focusRegion");

  const focusSelectedRegion = config.get<string>("regionName", "");
  const cicsPlex = config.get<string>("cicsPlex", "NA");
  const profileName = config.get<string>("profileName", "");

  return { profileName, focusSelectedRegion, cicsPlex };
}

export async function setFocusRegionIntoSettings(regionName: string, profileName: string, cicsPlexName?: string) {
  const cicsPlex = cicsPlexName == undefined ? "NA" : cicsPlexName;
  workspace.getConfiguration("zowe.cics").update("focusRegion", { regionName, cicsPlex, profileName }, ConfigurationTarget.Global);
}

export async function isCICSProfileValidInSettings(): Promise<boolean> {
  const regionDetails = await getFocusRegionFromSettings();
  const profileNames = await getAllCICSProfiles();
  if (regionDetails.profileName.length <= 0 || regionDetails.focusSelectedRegion.length <= 0 || regionDetails.cicsPlex.length <= 0) {
    return false;
  } else if (!profileNames.includes(regionDetails.profileName)) {
    await Gui.errorMessage(l10n.t("Profile {0} is invalid or not present", regionDetails.profileName));
    await Gui.infoMessage(l10n.t("Kindly set Focus Region from here"));
    return false;
  }
  return true;
}

export async function getPlexAndSessionFromProfileName(profileName: string) {
  let plex: InfoLoaded[] = [];
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName);
  const session = SessionHandler.getInstance().getSession(profile);
  try {
    plex = await ProfileManagement.getPlexInfo(profile, session);
  } catch (error) {
    await Gui.errorMessage(l10n.t("Error fetching CICSplex information for profile with reason {0}", error.message));
  }
  return { plex, session, profile };
}

export async function getAllCICSProfiles(): Promise<string[]> {
  const profileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
  const allCICSProfiles = profileInfo.getAllProfiles("cics");

  const allCICSProfileNames: string[] = allCICSProfiles ? (allCICSProfiles.map((profile) => profile.profName) as unknown as [string]) : [];
  return allCICSProfileNames;
}
