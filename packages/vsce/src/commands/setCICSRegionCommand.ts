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
import { commands, l10n, QuickPickItem } from "vscode";
import { ICICSRegionWithSession } from "../doc/commands/ICICSRegionWithSession";
import { SessionHandler } from "../resources";
import { CICSLogger } from "../utils/CICSLogger";
import { FilterDescriptor } from "../utils/filterUtils";
import * as regionUtils from "../utils/lastUsedRegionUtils";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";

async function resolveQuickPickChoice<T extends QuickPickItem>(quickPick: any, placeHolderKey: string, items: T[]): Promise<T | undefined> {
  quickPick.items = items;
  quickPick.placeholder = l10n.t(placeHolderKey);
  quickPick.ignoreFocusOut = true;
  quickPick.show();
  try {
    const raw = await Gui.resolveQuickPick(quickPick);
    if (!raw) {
      return undefined;
    }

    return items.find((it) => it.label === raw.label && (it.description ?? "") === (raw.description ?? ""));
  } finally {
    quickPick.hide();
  }
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
        l10n.t("cics.region.labelWithPlex", regionName, cicsPlexName, profileName)
      : l10n.t("cics.region.labelNoPlex", regionName, profileName);

    const items: QuickPickItem[] = [
      { label: lastUsedRegionLabel, description: l10n.t("cics.region.lastUsedDesc") },
      { label: l10n.t("cics.region.other") },
    ];

    const choice = await resolveQuickPickChoice(quickPick, "cics.select.region", [...items]);

    if (!choice) {
      return;
    }

    if (choice.label !== l10n.t("cics.region.other")) {
      const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName);
      const session = SessionHandler.getInstance().getSession(profile);
      return { profile, cicsPlexName, session, regionName };
    } else {
      return setCICSRegion();
    }
  } else {
    CICSLogger.info(l10n.t("cics.setting.new"));
    return setCICSRegion();
  }
}

async function setCICSRegion(): Promise<ICICSRegionWithSession | undefined> {
  const quickPick = Gui.createQuickPick();
  const profileNames = await regionUtils.getAllCICSProfiles();
  if (profileNames.length === 0) {
    Gui.infoMessage(l10n.t("cics.no.profiles.found"));
    return;
  }

  const cicsProfiles = profileNames.map((name) => new FilterDescriptor(name));
  let isPlex: boolean = false;
  let cicsPlexName: string | undefined = undefined;
  let regionName: string | undefined = undefined;
  let plexInfo: InfoLoaded[] | undefined = undefined;

  const profileChoice = await resolveQuickPickChoice(quickPick, "cics.select.profile", [...cicsProfiles]);
  if (!profileChoice) {
    return;
  }

  const selectedProfile = profileChoice;
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(selectedProfile.label);
  const session = SessionHandler.getInstance().getSession(profile);

  ({ cicsPlexName, regionName, isPlex, plexInfo } = await getPlexAndRegion(profile, cicsPlexName, regionName, isPlex, plexInfo));

  if (plexInfo && !cicsPlexName) {
    const result = await handlePlexInfo(plexInfo, quickPick, selectedProfile);
    if (result === null) {
      return;
    }
    ({ cicsPlexName, regionName, isPlex } = result);
  }

  if (isPlex) {
    const regionQuickPick = Gui.createQuickPick();
    regionQuickPick.placeholder = l10n.t("cics.select.region.placeholder");
    regionQuickPick.show();
    regionQuickPick.busy = true;
    regionQuickPick.items = [{ label: l10n.t("cics.loading.regions") }];
    let isCancelled = false;
    regionQuickPick.onDidHide(() => {
      isCancelled = true;
    });

    if (!cicsPlexName) {
      regionQuickPick.hide();
      return;
    }
    let regionInfo = await ProfileManagement.getRegionInfo(cicsPlexName, profile);
    if (isCancelled || !regionInfo) {
      regionQuickPick.hide();
      return;
    }

    if (regionInfo && regionInfo.length >= 0) {
      CICSLogger.info(l10n.t("cics.fetching.regions", cicsPlexName));
      regionInfo = regionInfo.filter((reg) => reg.cicsstate === "ACTIVE");
      const choice2 = await resolveQuickPickChoice(regionQuickPick, "cics.select.region", [
        ...regionInfo.map((region) => ({ label: region.cicsname })),
      ]);
      if (!choice2) {
        return;
      }

      regionName = choice2.label;
      CICSLogger.info(l10n.t("cics.region.set.info", regionName, selectedProfile.label, cicsPlexName ?? l10n.t("NA")));
    } else {
      regionQuickPick.hide();
      Gui.showMessage(l10n.t("cics.no.active.regions", cicsPlexName));
    }
  }

  if (!regionName) {
    return null;
  }

  regionUtils.setLastUsedRegion(regionName, profile.name, cicsPlexName);
  CICSLogger.info(l10n.t("cics.updating.settings", regionName, profile.name, cicsPlexName ?? l10n.t("NA")));
  return { profile, cicsPlexName, session, regionName };
}

async function handlePlexInfo(
  plexInfo: InfoLoaded[],
  quickPick: any,
  selectedProfile: FilterDescriptor
): Promise<{ cicsPlexName?: string; regionName?: string; isPlex: boolean } | null> {
  const plexNames = plexInfo.filter((p) => !p.group).map((p) => p.plexname);
  const regions = plexInfo.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

  if (regions.length > 0) {
    const region = regions.map((r) => r.map((reg) => reg.applid));
    const regionName = region[0][0];
    CICSLogger.info(l10n.t("cics.region.set.simple", regionName, selectedProfile.label));
    return { cicsPlexName: undefined, regionName, isPlex: false };
  } else if (plexNames.length > 0) {
    const choice = await resolveQuickPickChoice(quickPick, "cics.select.plex", [...plexNames.map((name) => ({ label: name }))]);
    if (!choice) {
      return null;
    }
    const cicsPlexName = choice.label;
    return { cicsPlexName, regionName: undefined, isPlex: true };
  } else {
    Gui.showMessage(l10n.t("cics.no.regions.or.plexes"));
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
      cicsPlexName = profile.profile.cicsPlex;
      regionName = profile.profile.regionName;
    } else {
      cicsPlexName = profile.profile.cicsPlex;
      isPlex = true;
    }
  } else {
    const quickPick = Gui.createQuickPick();
    let isCancelled = false;
    quickPick.placeholder = l10n.t("cics.select.plex");
    quickPick.show();
    quickPick.busy = true;
    quickPick.items = [{ label: l10n.t("cics.loading.plexes") }];
    quickPick.onDidHide(() => {
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
