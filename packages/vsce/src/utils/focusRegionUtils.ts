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
import { CICSSession } from "../resources";
import { CICSLogger } from "../utils/CICSLogger";
import { InfoLoaded, ProfileManagement } from "./profileManagement";
import { CICSTree } from "../trees";
import { PersistentStorage } from "./PersistentStorage";

const persistentStorage = new PersistentStorage("zowe.cics.persistent");
export function getFocusRegionFromSettings(): { profileName: string; focusSelectedRegion: string; cicsPlexName: string } {
  const { regionName, cicsPlexName, profileName } = persistentStorage.getLastUsedRegion();
  const focusSelectedRegion = regionName;

  return { profileName, focusSelectedRegion, cicsPlexName };
}

export function setFocusRegionIntoSettings(regionName: string, profileName: string, cicsPlexName?: string) {
  if (regionName != null && profileName != undefined) {
    const cicsPlex = cicsPlexName == undefined ? null : cicsPlexName;
    persistentStorage.setLastUsedRegion(regionName, cicsPlex, profileName);
    CICSLogger.info(`Focus region set to ${regionName} for profile ${profileName} and plex ${cicsPlex}`);
    Gui.showMessage(l10n.t("Region selected: {0} and CICSplex: {1}", regionName || "NA", cicsPlexName || "NA"));
  }
  //on error, do not update focus region
}
export async function isCICSProfileValidInSettings(): Promise<boolean> {
  const regionDetails = getFocusRegionFromSettings();
  const profileNames = await getAllCICSProfiles();
  if (!regionDetails.profileName || !regionDetails.focusSelectedRegion) {
    return false;
  } else if (!profileNames.includes(regionDetails.profileName)) {
    Gui.errorMessage(l10n.t("Profile {0} is invalid or not present", regionDetails.profileName));
    return false;
  }
  return true;
}

export async function getPlexInfoFromProfile(profile: IProfileLoaded, session: CICSSession) {
  try {
    return await ProfileManagement.getPlexInfo(profile, session);
  } catch (error) {
    Gui.errorMessage(l10n.t("Error fetching CICSplex information for profile with reason {0}", error.message));
  }
  return null;
}

export async function getAllCICSProfiles(): Promise<string[]> {
  const cicsTree: CICSTree = new CICSTree();
  await cicsTree.refreshLoadedProfiles();
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
