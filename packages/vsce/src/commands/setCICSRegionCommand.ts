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

import type { IProfileLoaded } from "@zowe/imperative";
import { Gui, MessageSeverity } from "@zowe/zowe-explorer-api";
import { commands, l10n } from "vscode";
import type { IManagedRegion } from "@zowe/cics-for-zowe-explorer-api";
import type { ICICSRegionWithSession } from "../doc/commands/ICICSRegionWithSession";
import { SessionHandler } from "../resources";
import { CICSLogger } from "../utils/CICSLogger";
import { FilterDescriptor } from "../utils/filterUtils";
import * as regionUtils from "../utils/lastUsedRegionUtils";
import { ProfileManagement, type InfoLoaded } from "../utils/profileManagement";

export function setCICSRegionCommand() {
  return commands.registerCommand("cics-extension-for-zowe.setCICSRegion", async () => {
    await setCICSRegion();
  });
}

export async function getLastUsedRegion(): Promise<ICICSRegionWithSession | undefined> {
  if (await regionUtils.isCICSProfileValidInSettings()) {
    const { profileName, regionName, cicsPlexName } = await regionUtils.getLastUsedRegion();
    const lastUsedRegionLabel =
      cicsPlexName ?
        l10n.t("Region: {0} | CICSplex : {1} | Profile: {2}", regionName, cicsPlexName, profileName)
      : l10n.t("Region: {0} | Profile: {1}", regionName, profileName);

    const otherLabel = l10n.t("Other CICS Region");
    const items = [{ label: lastUsedRegionLabel, description: l10n.t("Last used region") }, { label: otherLabel }];

    const quickPick = Gui.createQuickPick();
    const choice = await regionUtils.getChoiceFromQuickPick(quickPick, l10n.t("Select Region"), [...items]);
    quickPick.hide();
    quickPick.dispose();

    if (!choice) {
      return;
    }

    if (choice.label != otherLabel) {
      const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName);
      const session = SessionHandler.getInstance().getSession(profile);
      return { profile, cicsPlexName, session, regionName };
    } else {
      return setCICSRegion();
    }
  } else {
    CICSLogger.info("Setting new region");
    return setCICSRegion();
  }
}

export async function setCICSRegion(): Promise<ICICSRegionWithSession | undefined> {
  const quickPick = Gui.createQuickPick();
  const profileNames = await regionUtils.getAllCICSProfiles();
  if (profileNames.length === 0) {
    quickPick.dispose();
    Gui.infoMessage(l10n.t("No CICS profiles found. Please configure a valid CICS profile"));
    return;
  }

  const cicsProfiles = profileNames.map((name) => new FilterDescriptor(name));
  let isPlex: boolean = false;
  let cicsPlexName: string = undefined;
  let regionName: string = undefined;
  let plexInfo: InfoLoaded[] = undefined;
  let choice = await regionUtils.getChoiceFromQuickPick(quickPick, l10n.t("Select Profile"), [...cicsProfiles]);
  quickPick.hide();
  if (!choice) {
    quickPick.dispose();
    return;
  }

  const profileName = cicsProfiles.find((item) => item === choice);
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName.label);
  const session = SessionHandler.getInstance().getSession(profile);

  ({ cicsPlexName, regionName, isPlex, plexInfo } = await getPlexAndRegion(profile, cicsPlexName, regionName, isPlex, plexInfo));

  if (plexInfo && !cicsPlexName) {
    const plexNames = plexInfo.filter((p) => !p.group).map((p) => p.plexname);
    const regions = plexInfo.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

    //If profile has only regions and no plexes, we should show the regions
    if (regions.length > 0) {
      const region = regions.map((r) => r.map((reg) => reg.applid));
      regionName = region[0][0];
      CICSLogger.info(`Region set to ${regionName} for profile ${profileName.label}`);
    } else if (plexNames.length > 0) {
      choice = await regionUtils.getChoiceFromQuickPick(quickPick, l10n.t("Select CICSplex"), [...plexNames.map((name) => ({ label: name }))]);
      quickPick.hide();
      if (!choice) {
        quickPick.dispose();
        return;
      }

      cicsPlexName = choice.label;
      isPlex = true;
    } else {
      Gui.showMessage(l10n.t("No Regions or CICSplexes found in the selected profile."));
    }
  }

  // Dispose the profile selection quickPick before creating a new one
  quickPick.dispose();

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
    const regionInfoResult = await ProfileManagement.getRegionInfo(cicsPlexName, profile);
    if (isCancelled) {
      regionQuickPick.dispose();
      return;
    }

    // Check if regionInfo is null or undefined
    if (regionInfoResult?.regions?.length > 0) {
      CICSLogger.info("Fetching regions for CICSplex: " + cicsPlexName);
      const activeRegions = regionInfoResult.regions.filter((reg: IManagedRegion) => reg.cicsstate === "ACTIVE");
      choice = await regionUtils.getChoiceFromQuickPick(regionQuickPick, l10n.t("Select CICS Region"), [
        ...activeRegions.map((region: IManagedRegion) => ({ label: region.cicsname })),
      ]);
      regionQuickPick.hide();
      regionQuickPick.dispose();
      if (!choice) {
        return undefined;
      }

      regionName = choice.label;
      CICSLogger.info(`region set to ${regionName} for profile ${profileName.label} and plex ${cicsPlexName || "NA"}`);
    } else {
      regionQuickPick.hide();
      regionQuickPick.dispose();
      Gui.showMessage(l10n.t("No Active Regions found in {0}", cicsPlexName), { severity: MessageSeverity.ERROR });
    }
  }

  //Cancel if no region is selected
  if (!regionName) {
    return undefined;
  }

  regionUtils.setLastUsedRegion(regionName, profile.name, cicsPlexName);
  CICSLogger.info(`Updating region in settings: ${regionName}, profile: ${profile.name}, plex: ${cicsPlexName}`);
  return { profile, cicsPlexName, session, regionName };
}

async function getPlexAndRegion(profile: IProfileLoaded, cicsPlexName: string, regionName: string, isPlex: boolean, plexInfo: InfoLoaded[]) {
  if (profile.profile.cicsPlex) {
    if (profile.profile.regionName) {
      //Update if cicsPlex and regionName are present.
      cicsPlexName = profile.profile.cicsPlex;
      regionName = profile.profile.regionName;
    } else {
      //If only cicsPlex is present
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
