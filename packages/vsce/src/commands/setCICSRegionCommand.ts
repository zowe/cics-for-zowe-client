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
import { commands, l10n } from "vscode";
import { ICICSRegionWithSession } from "../doc/commands/ICICSRegionWithSession";
import { SessionHandler } from "../resources";
import { CICSLogger } from "../utils/CICSLogger";
import { FilterDescriptor } from "../utils/filterUtils";
import * as regionUtils from "../utils/lastUsedRegionUtils";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";

/* Localized templates / labels */
const LAST_USED_TEMPLATE = (region: string, plex: string, profile: string) =>
  l10n.t("Region: {0} | CICSplex : {1} | Profile: {2}", region, plex, profile);
const LAST_USED_NO_PLEX_TEMPLATE = (region: string, profile: string) => l10n.t("Region: {0} | Profile: {1}", region, profile);
const LAST_USED_DESC = l10n.t("Last used region");
const OTHER_REGION_LABEL = l10n.t("Other CICS Region");

const SELECT_REGION_TITLE = l10n.t("Select Region");
const SELECT_PROFILE_TITLE = l10n.t("Select Profile");
const SELECT_CICSPLEX_TITLE = l10n.t("Select CICSplex");
const SELECT_CICS_REGION = l10n.t("Select CICS Region");

const LOADING_REGIONS = l10n.t("Loading Regions...");
const LOADING_CICSPLEXES = l10n.t("Loading CICSplexes...");

const NO_CICS_PROFILES = l10n.t("No CICS profiles found. Please configure a valid CICS profile");
const NO_REGIONS_OR_PLEX = l10n.t("No Regions or CICSplexes found in the selected profile.");
const NO_ACTIVE_REGIONS_IN = (plex?: string) => l10n.t("No Active Regions found in {0}", plex ?? "");

export function setCICSRegionCommand() {
  return commands.registerCommand("cics-extension-for-zowe.setCICSRegion", async () => {
    await setCICSRegion();
  });
}

export async function getLastUsedRegion(): Promise<ICICSRegionWithSession | undefined> {
  const quickPick = Gui.createQuickPick();
  if (await regionUtils.isCICSProfileValidInSettings()) {
    const { profileName, regionName, cicsPlexName } = await regionUtils.getLastUsedRegion();
    let lastUsedRegionLabel =
      cicsPlexName ? LAST_USED_TEMPLATE(regionName, cicsPlexName, profileName) : LAST_USED_NO_PLEX_TEMPLATE(regionName, profileName);

    const items = [{ label: lastUsedRegionLabel, description: LAST_USED_DESC }, { label: OTHER_REGION_LABEL }];
    const choice = await regionUtils.getChoiceFromQuickPick(quickPick, SELECT_REGION_TITLE, [...items]);
    quickPick.hide();

    if (!choice) return;

    if (choice.label !== OTHER_REGION_LABEL) {
      const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName);
      const session = SessionHandler.getInstance().getSession(profile);
      return { profile, cicsPlexName, session, regionName };
    } else {
      return await setCICSRegion();
    }
  } else {
    CICSLogger.info("Setting new region");
    return await setCICSRegion();
  }
}

async function setCICSRegion(): Promise<ICICSRegionWithSession | undefined> {
  const quickPick = Gui.createQuickPick();
  const profileNames = await regionUtils.getAllCICSProfiles();
  if (profileNames.length === 0) {
    Gui.infoMessage(NO_CICS_PROFILES);
    return;
  }

  const cicsProfiles = profileNames.map((name) => new FilterDescriptor(name));
  let isPlex = false;
  let cicsPlexName: string | undefined = undefined;
  let regionName: string | undefined = undefined;
  let plexInfo: InfoLoaded[] | undefined = undefined;

  let choice = await regionUtils.getChoiceFromQuickPick(quickPick, SELECT_PROFILE_TITLE, [...cicsProfiles]);
  quickPick.hide();
  if (!choice) return;

  const profileSelection = cicsProfiles.find((item) => item === choice);
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileSelection.label);
  const session = SessionHandler.getInstance().getSession(profile);

  ({ cicsPlexName, regionName, isPlex, plexInfo } = await getPlexAndRegion(profile, cicsPlexName, regionName, isPlex, plexInfo));

  if (plexInfo && !cicsPlexName) {
    const plexNames = plexInfo.filter((p) => !p.group).map((p) => p.plexname);
    const regions = plexInfo.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

    // If profile has only regions and no plexes, we should show the regions
    if (regions.length > 0) {
      const region = regions.map((r) => r.map((reg) => reg.applid));
      regionName = region[0][0];
      CICSLogger.info(`Region set to ${regionName} for profile ${profileSelection.label}`);
    } else if (plexNames.length > 0) {
      choice = await regionUtils.getChoiceFromQuickPick(quickPick, SELECT_CICSPLEX_TITLE, [...plexNames.map((name) => ({ label: name }))]);
      quickPick.hide();
      if (!choice) return;

      cicsPlexName = choice.label;
      isPlex = true;
    } else {
      console.log(NO_REGIONS_OR_PLEX);
    }
  }

  if (isPlex) {
    const regionQuickPick = Gui.createQuickPick();
    regionQuickPick.placeholder = SELECT_CICS_REGION;
    regionQuickPick.show();
    regionQuickPick.busy = true;
    regionQuickPick.items = [{ label: LOADING_REGIONS }];
    let isCancelled = false;
    regionQuickPick.onDidHide(() => {
      // This will be called when ESC is pressed or quickPick.hide() is called
      isCancelled = true;
    });

    let regionInfo = await ProfileManagement.getRegionInfo(cicsPlexName, profile);
    if (isCancelled || !regionInfo) return;

    // Check if regionInfo is null or undefined
    if (regionInfo && regionInfo.length >= 0) {
      CICSLogger.info("Fetching regions for CICSplex: " + cicsPlexName);
      regionInfo = regionInfo.filter((reg) => reg.cicsstate === "ACTIVE");
      choice = await regionUtils.getChoiceFromQuickPick(regionQuickPick, SELECT_CICS_REGION, [
        ...regionInfo.map((region) => ({ label: region.cicsname })),
      ]);
      regionQuickPick.hide();
      if (!choice) return;

      regionName = choice.label;
      CICSLogger.info(`region set to ${regionName} for profile ${profileSelection.label} and plex ${cicsPlexName || "NA"}`);
    } else {
      regionQuickPick.hide();
      console.log(NO_ACTIVE_REGIONS_IN(cicsPlexName));
    }
  }

  // Cancel if no region is selected
  if (!regionName) return null;

  regionUtils.setLastUsedRegion(regionName, profile.name, cicsPlexName);
  CICSLogger.info(`Updating region in settings: ${regionName}, profile: ${profile.name}, plex: ${cicsPlexName}`);
  return { profile, cicsPlexName, session, regionName };
}

async function getPlexAndRegion(
  profile: IProfileLoaded,
  cicsPlexName: string | undefined,
  regionName: string | undefined,
  isPlex: boolean,
  plexInfo: InfoLoaded[] | undefined
) {
  if (profile.profile.cicsPlex) {
    if (profile.profile.regionName) {
      // Update if cicsPlex and regionName are present.
      cicsPlexName = profile.profile.cicsPlex;
      regionName = profile.profile.regionName;
    } else {
      // If only cicsPlex is present
      cicsPlexName = profile.profile.cicsPlex;
      isPlex = true;
    }
  } else {
    const quickPick = Gui.createQuickPick();
    let isCancelled = false;
    quickPick.placeholder = SELECT_CICSPLEX_TITLE;
    quickPick.show();
    quickPick.busy = true;
    quickPick.items = [{ label: LOADING_CICSPLEXES }];
    quickPick.onDidHide(() => {
      // This will be called when ESC is pressed or quickPick.hide() is called
      isCancelled = true;
    });
    plexInfo = await regionUtils.getPlexInfoFromProfile(profile);
    if (isCancelled || !plexInfo) {
      quickPick.hide();
      return {};
    }
  }
  return { cicsPlexName, regionName, isPlex, plexInfo };
}
