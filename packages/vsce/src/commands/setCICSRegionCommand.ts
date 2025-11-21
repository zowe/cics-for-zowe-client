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

type QuickPickItemWithId = { id?: string; label: string; description?: string };

function logInfo(key: string, ...args: any[]) {
  CICSLogger.info(l10n.t(key, ...args));
}

export function setCICSRegionCommand() {
  return commands.registerCommand("cics-extension-for-zowe.setCICSRegion", async () => {
    await setCICSRegion();
  });
}

export async function getLastUsedRegion(): Promise<ICICSRegionWithSession | undefined> {
  const quickPick = Gui.createQuickPick();
  if (await regionUtils.isCICSProfileValidInSettings()) {
    const { profileName, regionName, cicsPlexName } = await regionUtils.getLastUsedRegion();

    const lastUsedRegionLabel =
      cicsPlexName !== undefined ?
        l10n.t("Region: {0} | CICSplex: {1} | Profile: {2}", regionName, cicsPlexName, profileName)
      : l10n.t("Region: {0} | Profile: {1}", regionName, profileName);

    const items: QuickPickItemWithId[] = [
      { id: "last", label: lastUsedRegionLabel, description: l10n.t("Last used region") },
      { id: "other", label: l10n.t("Other CICS Region") },
    ];

    const choice = await regionUtils.getChoiceFromQuickPick(quickPick, l10n.t("Select Region"), [...items]);
    quickPick.hide();

    if (!choice) {
      return;
    }

    const selected = choice as QuickPickItemWithId;
    if (selected.id !== "other") {
      const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName);
      const session = SessionHandler.getInstance().getSession(profile);
      return { profile, cicsPlexName, session, regionName };
    } else {
      return setCICSRegion();
    }
  } else {
    logInfo("Setting new region");
    return setCICSRegion();
  }
}

async function setCICSRegion(): Promise<ICICSRegionWithSession | undefined> {
  const quickPick = Gui.createQuickPick();
  const profileNames = await regionUtils.getAllCICSProfiles();
  if (profileNames.length === 0) {
    Gui.infoMessage(l10n.t("No CICS profiles found. Please configure a valid CICS profile"));
    return;
  }

  const cicsProfiles = profileNames.map((name) => new FilterDescriptor(name));
  let isPlex: boolean = false;
  let cicsPlexName: string | undefined = undefined;
  let regionName: string | undefined = undefined;
  let plexInfo: InfoLoaded[] | undefined = undefined;

  const choice = await regionUtils.getChoiceFromQuickPick(quickPick, l10n.t("Select Profile"), [...cicsProfiles]);
  quickPick.hide();
  if (!choice) {
    return;
  }

  // choice should be a FilterDescriptor
  const selectedProfile = choice as FilterDescriptor;
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(selectedProfile.label);
  const session = SessionHandler.getInstance().getSession(profile);

  ({ cicsPlexName, regionName, isPlex, plexInfo } = await getPlexAndRegion(profile, cicsPlexName, regionName, isPlex, plexInfo));

  if (plexInfo && !cicsPlexName) {
    const result = await handlePlexInfo(plexInfo, quickPick, selectedProfile, profile);
    if (result === null) {
      return;
    }
    ({ cicsPlexName, regionName, isPlex } = result);
  }

  if (isPlex) {
    const regionQuickPick = Gui.createQuickPick();
    regionQuickPick.placeholder = l10n.t("Select CICS Region");
    regionQuickPick.show();
    regionQuickPick.busy = true;
    regionQuickPick.items = [{ label: l10n.t("Loading Regions...") }];
    let isCancelled = false;
    regionQuickPick.onDidHide(() => {
      // This will be called when ESC is pressed or quickPick.hide() is called
      isCancelled = true;
    });
    let regionInfo = await ProfileManagement.getRegionInfo(cicsPlexName!, profile);
    if (isCancelled || !regionInfo) {
      return;
    }

    // Check if regionInfo is null or undefined
    if (regionInfo && regionInfo.length >= 0) {
      logInfo("Fetching regions for CICSplex: {0}", cicsPlexName);
      regionInfo = regionInfo.filter((reg) => reg.cicsstate === "ACTIVE");
      const choice2 = await regionUtils.getChoiceFromQuickPick(regionQuickPick, l10n.t("Select CICS Region"), [
        ...regionInfo.map((region) => ({ label: region.cicsname })),
      ]);
      regionQuickPick.hide();
      if (!choice2) {
        return;
      }

      regionName = choice2.label;
      logInfo("region set to {0} for profile {1} and plex {2}", regionName, selectedProfile.label, cicsPlexName ?? l10n.t("NA"));
    } else {
      regionQuickPick.hide();
      Gui.showMessage(l10n.t("No Active Regions found in {0}", cicsPlexName));
    }
  }

  // Cancel if no region is selected
  if (!regionName) {
    return null;
  }

  regionUtils.setLastUsedRegion(regionName, profile.name, cicsPlexName);
  logInfo("Updating region in settings: {0}, profile: {1}, plex: {2}", regionName, profile.name, cicsPlexName ?? l10n.t("NA"));
  return { profile, cicsPlexName, session, regionName };
}

async function handlePlexInfo(
  plexInfo: InfoLoaded[],
  quickPick: any,
  selectedProfile: FilterDescriptor,
  profile: IProfileLoaded
): Promise<{ cicsPlexName?: string; regionName?: string; isPlex: boolean } | null> {
  const plexNames = plexInfo.filter((p) => !p.group).map((p) => p.plexname);
  const regions = plexInfo.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

  // If profile has only regions and no plexes, we should show the regions
  if (regions.length > 0) {
    const region = regions.map((r) => r.map((reg) => reg.applid));
    const regionName = region[0][0];
    logInfo("Region set to {0} for profile {1}", regionName, selectedProfile.label);
    return { cicsPlexName: undefined, regionName, isPlex: false };
  } else if (plexNames.length > 0) {
    const choice = await regionUtils.getChoiceFromQuickPick(quickPick, l10n.t("Select CICSplex"), [...plexNames.map((name) => ({ label: name }))]);
    quickPick.hide();
    if (!choice) {
      return null;
    }
    const cicsPlexName = choice.label;
    return { cicsPlexName, regionName: undefined, isPlex: true };
  } else {
    Gui.showMessage(l10n.t("No Regions or CICSplexes found in the selected profile."));
    return { cicsPlexName: undefined, regionName: undefined, isPlex: false };
  }
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
    quickPick.placeholder = l10n.t("Select CICSplex");
    quickPick.show();
    quickPick.busy = true;
    quickPick.items = [{ label: l10n.t("Loading CICSplexes...") }];
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
