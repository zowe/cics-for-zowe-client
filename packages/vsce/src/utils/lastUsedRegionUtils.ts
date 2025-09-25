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

import { IProfileLoaded } from "@zowe/imperative";
import { Gui } from "@zowe/zowe-explorer-api";
import { l10n, QuickPick, QuickPickItem } from "vscode";
import { CICSTree } from "../trees";
import { CICSLogger } from "./CICSLogger";
import PersistentStorage from "./PersistentStorage";
import { InfoLoaded, ProfileManagement } from "./profileManagement";

export function getLastUsedRegion(): { profileName: string; regionName: string; cicsPlexName: string } {
  return PersistentStorage.getLastUsedRegion();
}

export function setLastUsedRegion(regionName: string, profileName: string, cicsPlexName?: string) {
  if (regionName != null && profileName != undefined && regionName.length > 0 && profileName.length > 0) {
    PersistentStorage.setLastUsedRegion({ regionName, cicsPlexName, profileName });
    CICSLogger.info(`Region set to ${regionName} for profile ${profileName} and plex ${cicsPlexName}`);
  }
  //on error, do not update region
}
export async function isCICSProfileValidInSettings(): Promise<boolean> {
  const regionDetails = getLastUsedRegion();
  const profileNames = await getAllCICSProfiles();
  if (!regionDetails.profileName || !regionDetails.regionName) {
    return false;
  } else if (!profileNames.includes(regionDetails.profileName)) {
    CICSLogger.error(l10n.t("Profile {0} is invalid or not present", regionDetails.profileName));
    return false;
  }
  return true;
}

export async function getPlexInfoFromProfile(profile: IProfileLoaded): Promise<InfoLoaded[] | null> {
  try {
    return await ProfileManagement.getPlexInfo(profile);
  } catch (error) {
    CICSLogger.error(l10n.t("Error fetching CICSplex information for profile with reason {0}", error.message));
  }
  return null;
}

export async function getAllCICSProfiles(): Promise<string[]> {
  const cicsTree: CICSTree = new CICSTree();
  cicsTree.clearLoadedProfiles();
  await cicsTree.loadStoredProfileNames();
  const loadedprofiles = cicsTree.getLoadedProfiles();
  if (loadedprofiles.length > 0) {
    return loadedprofiles.map((profile) => profile.label) as string[];
  }
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
  quickPick.busy = false;
  quickPick.items = items;
  quickPick.placeholder = l10n.t(placeHolder);
  quickPick.ignoreFocusOut = true;
  quickPick.title = l10n.t("Select CICS Region");
  quickPick.show();
  const choice = await Gui.resolveQuickPick(quickPick);
  return choice;
}
