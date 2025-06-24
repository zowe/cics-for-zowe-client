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
import { commands, l10n, QuickPick, QuickPickItem } from "vscode";
import { FilterDescriptor } from "../utils/filterUtils";
import { ProfileManagement } from "../utils/profileManagement";
import { IFocusRegion } from "../doc/commands/IFocusRegion";
import {
  getAllCICSProfiles,
  getFocusRegionFromSettings,
  getPlexAndSessionFromProfileName,
  isCICSProfileValidInSettings,
  setFocusRegionIntoSettings,
} from "../utils/focusRegionUtils";
import { SessionHandler } from "../resources";

export function setFocusRegionCommand() {
  return commands.registerCommand("cics-extension-for-zowe.setFocusRegion", async () => {
    await updateFocusRegion();
  });
}

export async function getFocusRegion(): Promise<IFocusRegion | undefined> {
  if (await isCICSProfileValidInSettings()) {
    const { profileName, focusSelectedRegion, cicsPlex } = await getFocusRegionFromSettings();
    const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName);
    const session = SessionHandler.getInstance().getSession(profile);
    return { profile, cicsPlex, session, focusSelectedRegion };
  } else {
    const { profile, cicsPlex, session, focusSelectedRegion }: IFocusRegion = await updateFocusRegion();
    return { profile, cicsPlex, session, focusSelectedRegion } as IFocusRegion;
  }
}

async function getChoiceFromQuickPick(
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

async function updateFocusRegion(): Promise<IFocusRegion> {
  const quickPick = Gui.createQuickPick();
  const profileNames = await getAllCICSProfiles();
  const cicsProfiles = profileNames.map((name) => new FilterDescriptor(name));

  let isPlex: boolean = false;
  let cicsPlex: string = undefined;
  let focusSelectedRegion: string = undefined;
  let choice = await getChoiceFromQuickPick(quickPick, "Select Profile", [...cicsProfiles]);
  quickPick.hide();
  const profileName = cicsProfiles.find((item) => item === choice);
  //fetch the profile information and session
  const { plex, session, profile } = await getPlexAndSessionFromProfileName(profileName.label);

  if (plex) {
    const plexNames = plex.filter((p) => !p.group).map((p) => p.plexname);
    const regions = plex.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

    //If profile has only regions and no plexes, we should show the regions
    if (regions.length > 0) {
      const region = regions.map((r) => r.map((reg) => reg.applid));
      choice = await getChoiceFromQuickPick(quickPick, "Select Region", [...region.map((name) => new FilterDescriptor(name[0]))]);
      focusSelectedRegion = choice.label;
    } else if (plexNames.length > 0) {
      choice = await getChoiceFromQuickPick(quickPick, "Select CICSplex", [...plexNames.map((name) => ({ label: name }))]);
      isPlex = true;
    } else {
      Gui.showMessage(l10n.t("No Focus Regions or CICSplexes found in the selected profile."));
    }
    quickPick.hide();
  }
  if (isPlex) {
    //if plex is selected, we should show the regions from the plex
    cicsPlex = choice.label;
    let regionInfo = await ProfileManagement.getRegionInfo(cicsPlex, session);
    regionInfo = regionInfo.filter((reg) => reg.cicsstate === "ACTIVE");
    choice = await getChoiceFromQuickPick(quickPick, "Select Region", [...regionInfo.map((region) => ({ label: region.cicsname }))]);
    quickPick.hide();
    focusSelectedRegion = choice.label;
  }
  await setFocusRegionIntoSettings(focusSelectedRegion, profile.name, cicsPlex);
  Gui.showMessage(l10n.t("Focus Region selected: {0} and CICSplex: {1}", focusSelectedRegion || "NA", cicsPlex || "NA"));
  return { profile, cicsPlex, session, focusSelectedRegion };
}
