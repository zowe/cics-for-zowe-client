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

async function updateFocusRegion(): Promise<IFocusRegion> {
  const quickPick = Gui.createQuickPick();
  const profileNames = await getAllCICSProfiles();
  const cicsProfiles = profileNames.map((name) => new FilterDescriptor(name));

  let isPlex: boolean = false;
  let cicsPlex: string = undefined;
  let focusSelectedRegion: string = undefined;
  let plex: InfoLoaded[] = undefined;
  let choice = await getChoiceFromQuickPick(quickPick, "Select Profile", [...cicsProfiles]);
  quickPick.hide();
  if (!choice) {
    Gui.infoMessage(l10n.t("No selection made. Operation cancelled."));
    return;
  }

  const profileName = cicsProfiles.find((item) => item === choice);
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName.label);
  const session = SessionHandler.getInstance().getSession(profile);

  ({ cicsPlex, focusSelectedRegion, isPlex, plex } = await getPlexAndRegion(profile, cicsPlex, focusSelectedRegion, isPlex, plex, session));

  if (plex && !cicsPlex) {
    const plexNames = plex.filter((p) => !p.group).map((p) => p.plexname);
    const regions = plex.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

    //If profile has only regions and no plexes, we should show the regions
    if (regions.length > 0) {
      const region = regions.map((r) => r.map((reg) => reg.applid));
      focusSelectedRegion = region[0][0];
    } else if (plexNames.length > 0) {
      choice = await getChoiceFromQuickPick(quickPick, "Select CICSplex", [...plexNames.map((name) => ({ label: name }))]);
      quickPick.hide();
      if (!choice) {
        Gui.infoMessage(l10n.t("No selection made. Operation cancelled."));
        return;
      }
      cicsPlex = choice.label;
      isPlex = true;
    } else {
      Gui.showMessage(l10n.t("No Focus Regions or CICSplexes found in the selected profile."));
    }
  }
  if (isPlex) {
    //if plex is selected, we should show the regions from the plex
    let regionInfo = await ProfileManagement.getRegionInfo(cicsPlex, session);
    regionInfo = regionInfo.filter((reg) => reg.cicsstate === "ACTIVE");
    choice = await getChoiceFromQuickPick(quickPick, "Select Region", [...regionInfo.map((region) => ({ label: region.cicsname }))]);
    quickPick.hide();
    if (!choice) {
      Gui.infoMessage(l10n.t("No selection made. Operation cancelled."));
      return;
    }
    focusSelectedRegion = choice.label;
  }
  await setFocusRegionIntoSettings(focusSelectedRegion, profile.name, cicsPlex);
  Gui.showMessage(l10n.t("Focus Region selected: {0} and CICSplex: {1}", focusSelectedRegion || "NA", cicsPlex || "NA"));
  return { profile, cicsPlex, session, focusSelectedRegion };
}


async function getPlexAndRegion(
  profile: IProfileLoaded,
  cicsPlex: string,
  focusSelectedRegion: string,
  isPlex: boolean,
  plex: InfoLoaded[],
  session: CICSSession
) {
  if (profile.profile.cicsPlex) {
    if (profile.profile.regionName) {
      //Update if cicsPlex and regionName are present.
      cicsPlex = profile.profile.cicsPlex;
      focusSelectedRegion = profile.profile.regionName;
    } else {
      //If only cicsPlex is present
      cicsPlex = profile.profile.cicsPlex;
      isPlex = true;
    }
  } else {
    plex = await getPlexInfoFromProfile(profile, session);
  }
  return { cicsPlex, focusSelectedRegion, isPlex, plex };
}
