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
import { ConfigurationTarget, l10n, QuickPick, QuickPickItem, workspace } from "vscode";
import { CICSSession } from "../resources";
import { InfoLoaded, ProfileManagement } from "./profileManagement";
import { IProfileLoaded } from "@zowe/imperative";
import { CICSLogger } from "../utils/CICSLogger";

export function getFocusRegionFromSettings(): { profileName: string; focusSelectedRegion: string; cicsPlex: string } {
  const config = workspace.getConfiguration("zowe.cics.focusRegion");

  const focusSelectedRegion = config.get<string>("regionName", undefined);
  const cicsPlex = config.get<string>("cicsPlex", undefined);
  const profileName = config.get<string>("profileName", undefined);

  return { profileName, focusSelectedRegion, cicsPlex };
}

export async function setFocusRegionIntoSettings(regionName: string, profileName: string, cicsPlexName?: string) {
  const cicsPlex = cicsPlexName == undefined ? null : cicsPlexName;
  workspace.getConfiguration("zowe.cics").update("focusRegion", { regionName, cicsPlex, profileName }, ConfigurationTarget.Global);
  CICSLogger.info(`Focus region set to ${regionName} for profile ${profileName} and plex ${cicsPlex}`);
}
export async function isCICSProfileValidInSettings(): Promise<boolean> {
  const regionDetails = getFocusRegionFromSettings();
  const profileNames = await getAllCICSProfiles();
  if (!regionDetails.profileName || !regionDetails.focusSelectedRegion) {
    return false;
  } else if (!profileNames.includes(regionDetails.profileName)) {
    await Gui.errorMessage(l10n.t("Profile {0} is invalid or not present", regionDetails.profileName));
    return false;
  }
  return true;
}

export async function getPlexInfoFromProfile(profile: IProfileLoaded, session: CICSSession) {
  let plex: InfoLoaded[] = [];
  try {
    plex = await ProfileManagement.getPlexInfo(profile, session);
  } catch (error) {
    await Gui.errorMessage(l10n.t("Error fetching CICSplex information for profile with reason {0}", error.message));
  }
  return plex;
}

export async function getAllCICSProfiles(): Promise<string[]> {
  const profileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
  const allCICSProfiles = profileInfo.getAllProfiles("cics");

  const allCICSProfileNames: string[] = allCICSProfiles ? (allCICSProfiles.map((profile) => profile.profName) as unknown as [string]) : [];
  return allCICSProfileNames;
}

export async function getChoiceFromQuickPick(
  quickPick: QuickPick<QuickPickItem>,
  placeHolder: string,
  items: QuickPickItem[]
): Promise<QuickPickItem | undefined> {
  quickPick.items = items;
  quickPick.placeholder = l10n.t(placeHolder);
  quickPick.ignoreFocusOut = true;
  quickPick.show();
  const choice = await Gui.resolveQuickPick(quickPick);
  return choice;
}
