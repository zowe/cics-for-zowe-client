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
import { commands, l10n } from "vscode";
import { FilterDescriptor } from "../utils/filterUtils";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";
import { IFocusRegion } from "../doc/commands/IFocusRegion";
import {
  getAllCICSProfiles,
  getChoiceFromQuickPick,
  getFocusRegionFromSettings,
  getPlexInfoFromProfile,
  isCICSProfileValidInSettings,
  setFocusRegionIntoSettings,
} from "../utils/focusRegionUtils";
import { CICSSession, SessionHandler } from "../resources";
import { IProfileLoaded } from "@zowe/imperative";
import { CICSLogger } from "../utils/CICSLogger";

export function setFocusRegionCommand() {
  return commands.registerCommand("cics-extension-for-zowe.setFocusRegion", async () => {
    await updateFocusRegion();
  });
}

export async function getFocusRegion(): Promise<IFocusRegion | undefined> {
  const quickPick = Gui.createQuickPick();
  if (await isCICSProfileValidInSettings()) {
    const { profileName, focusSelectedRegion, cicsPlexName } = await getFocusRegionFromSettings();
    const items = [
      { label: `Region: ${focusSelectedRegion} | CICSplex : ${cicsPlexName || "NA"} | Profile: ${profileName}`, description: "Last used region" },
      { label: "Other CICS Region" },
    ];
    const choice = await getChoiceFromQuickPick(quickPick, "Select Region", [...items]);
    quickPick.hide();

    if (!choice) return;

    if (choice.label != "Other CICS Region") {
      const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName);
      const session = SessionHandler.getInstance().getSession(profile);
      return { profile, cicsPlexName, session, focusSelectedRegion };
    } else {
      return await updateFocusRegion();
    }
  } else {
    CICSLogger.info("Setting new region");
    return await updateFocusRegion();
  }
}

async function updateFocusRegion(): Promise<IFocusRegion> | undefined{
  const quickPick = Gui.createQuickPick();
  const profileNames = await getAllCICSProfiles();
  if (profileNames.length === 0) {
    Gui.infoMessage(l10n.t("No CICS profiles found. Please configure a valid CICS profile"));
    return;
  }

  const cicsProfiles = profileNames.map((name) => new FilterDescriptor(name));
  let isPlex: boolean = false;
  let cicsPlexName: string = undefined;
  let focusSelectedRegion: string = undefined;
  let plexInfo: InfoLoaded[] = undefined;
  let choice = await getChoiceFromQuickPick(quickPick, "Select Profile", [...cicsProfiles]);
  quickPick.hide();
  if (!choice) return;

  const profileName = cicsProfiles.find((item) => item === choice);
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName.label);
  const session = SessionHandler.getInstance().getSession(profile);

  ({ cicsPlexName, focusSelectedRegion, isPlex, plexInfo } = await getPlexAndRegion(profile, cicsPlexName, focusSelectedRegion, isPlex, plexInfo, session));

  if (plexInfo && !cicsPlexName) {
    const plexNames = plexInfo.filter((p) => !p.group).map((p) => p.plexname);
    const regions = plexInfo.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

    //If profile has only regions and no plexes, we should show the regions
    if (regions.length > 0) {
      const region = regions.map((r) => r.map((reg) => reg.applid));
      focusSelectedRegion = region[0][0];
      CICSLogger.info(`Region set to ${focusSelectedRegion} for profile ${profileName.label}`);
    } else if (plexNames.length > 0) {
      choice = await getChoiceFromQuickPick(quickPick, "Select CICSplex", [...plexNames.map((name) => ({ label: name }))]);
      quickPick.hide();
      if (!choice) return;

      cicsPlexName = choice.label;
      isPlex = true;
    } else {
      Gui.showMessage(l10n.t("No Regions or CICSplexes found in the selected profile."));
    }
  }
  if (isPlex) {
    //if plex is selected, we should show the regions from the plex
    let regionInfo = await ProfileManagement.getRegionInfo(cicsPlexName, session);
    CICSLogger.info("Fetching regions for CICSplex: " + cicsPlexName);
    regionInfo = regionInfo.filter((reg) => reg.cicsstate === "ACTIVE");
    choice = await getChoiceFromQuickPick(quickPick, "Select CICS Region", [...regionInfo.map((region) => ({ label: region.cicsname }))]);
    quickPick.hide();
    if (!choice) return;

    focusSelectedRegion = choice.label;
    CICSLogger.info(`region set to ${focusSelectedRegion} for profile ${profileName.label} and plex ${cicsPlexName || "NA"}`);
  }
  setFocusRegionIntoSettings(focusSelectedRegion, profile.name, cicsPlexName);
  CICSLogger.info(`Updating region in settings: ${focusSelectedRegion}, profile: ${profile.name}, plex: ${cicsPlexName}`);
  Gui.showMessage(l10n.t("Region selected: {0} and CICSplex: {1}", focusSelectedRegion || "NA", cicsPlexName || "NA"));
  return { profile, cicsPlexName, session, focusSelectedRegion };
}


async function getPlexAndRegion(
  profile: IProfileLoaded,
  cicsPlexName: string,
  focusSelectedRegion: string,
  isPlex: boolean,
  plexInfo: InfoLoaded[],
  session: CICSSession
) {
  if (profile.profile.cicsPlex) {
    if (profile.profile.regionName) {
      //Update if cicsPlex and regionName are present.
      cicsPlexName = profile.profile.cicsPlex;
      focusSelectedRegion = profile.profile.regionName;
    } else {
      //If only cicsPlex is present
      cicsPlexName = profile.profile.cicsPlex;
      isPlex = true;
    }
  } else {
    plexInfo = await getPlexInfoFromProfile(profile, session);
  }
  return { cicsPlexName, focusSelectedRegion, isPlex, plexInfo };
}
