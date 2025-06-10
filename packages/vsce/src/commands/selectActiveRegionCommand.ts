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
import { commands, l10n, QuickPick, QuickPickItem } from "vscode";
import { CICSSession } from "../resources";
import { FilterDescriptor } from "../utils/filterUtils";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";

export interface IActiveRegion {
  profile: IProfileLoaded;
  cicsPlex?: string;
  session: CICSSession;
  activeSelectedRegion: string;
}

export function selectActiveRegion() {
  return commands.registerCommand("cics-extension-for-zowe.selectActiveRegion", async () => {
    await getActiveRegion();
  });
}

export async function getActiveRegion(): Promise<IActiveRegion | undefined> {
  const quickPick = Gui.createQuickPick();
  const profileNames = await getAllCICSProfiles();

  const { profile, cicsPlex, session, activeSelectedRegion }: IActiveRegion = await updateActiveRegion(quickPick, profileNames);
  //To verify if the user has selected a region or plex
  Gui.showMessage(l10n.t("Active region selected: {0} and plex: {1}", activeSelectedRegion, cicsPlex || "NA"));
  return { profile, cicsPlex, session, activeSelectedRegion } as IActiveRegion;
}

async function getPlexAndSessionFromProfileChoice(profileName: QuickPickItem) {
  let plex: InfoLoaded[] = [];
  const profile = await ProfileManagement.getProfilesCache().getLoadedProfConfig(profileName.label);
  const session = new CICSSession({
    type: "token",
    tokenType: "ltpa",
    storeCookie: true,
    protocol: profile.profile.protocol,
    hostname: profile.profile.host,
    port: Number(profile.profile.port),
    user: profile.profile.user || "",
    password: profile.profile.password || "",
    rejectUnauthorized: profile.profile.rejectUnauthorized,
  });
  try {
    plex = await ProfileManagement.getPlexInfo(profile, session);
  } catch (error) {
    await Gui.errorMessage(l10n.t("Error fetching plex information for profile with reason {0}", error.message));
  }
  return { plex, session, profile };
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

async function getAllCICSProfiles(): Promise<FilterDescriptor[]> {
  const profileInfo = await ProfileManagement.getProfilesCache().getProfileInfo();
  const allCICSProfiles = profileInfo.getAllProfiles("cics");

  const allCICSProfileNames: string[] = allCICSProfiles ? (allCICSProfiles.map((profile) => profile.profName) as unknown as [string]) : [];
  const cicsProfiles = allCICSProfileNames.map((name) => new FilterDescriptor(name));
  return cicsProfiles;
}

async function updateActiveRegion(quickPick: QuickPick<QuickPickItem>, profileNames: FilterDescriptor[]): Promise<IActiveRegion> {
  let isPlex: boolean = false;
  let cicsPlex: string = undefined;
  let activeSelectedRegion: string = undefined;
  let choice = await getChoiceFromQuickPick(quickPick, "Select Profile", [...profileNames]);
  quickPick.hide();
  const profileName = profileNames.find((item) => item === choice);
  //fetch the profile information and session
  const { plex, session, profile } = await getPlexAndSessionFromProfileChoice(profileName);

  if (plex) {
    const plexNames = plex.filter((p) => !p.group).map((p) => p.plexname);
    const regions = plex.filter((p) => !p.group && p.plexname === null).map((p) => p.regions);

    //If profile has only regions and no plexes, we should show the regions
    if (regions.length > 0) {
      const region = regions.map((r) => r.map((reg) => reg.applid));
      choice = await getChoiceFromQuickPick(quickPick, "Select Region", [...region.map((name) => new FilterDescriptor(name[0]))]);
      activeSelectedRegion = choice.label;
    } else if (plexNames.length > 0) {
      choice = await getChoiceFromQuickPick(quickPick, "Select Plex", [...plexNames.map((name) => ({ label: name }))]);
      isPlex = true;
    } else {
      Gui.showMessage(l10n.t("No active regions or plexes found in the selected profile."));
    }
    quickPick.hide();
  }
  if (isPlex) {
    //if plex is selected, we should show the regions from the plex
    cicsPlex = choice.label;
    let regionInfo = await ProfileManagement.getRegionInfoInPlex(null, cicsPlex, session);
    regionInfo = regionInfo.filter((reg) => reg.cicsstate === "ACTIVE");
    choice = await getChoiceFromQuickPick(quickPick, "Select Region", [...regionInfo.map((region) => ({ label: region.cicsname }))]);
    quickPick.hide();
    activeSelectedRegion = choice.label;
  }

  return { profile, cicsPlex, session, activeSelectedRegion };
}
