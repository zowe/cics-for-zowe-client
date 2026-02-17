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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { IProfileLoaded } from "@zowe/imperative";
import { Gui, ZoweExplorerApiType, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import { QuickPickOptions, TreeView, commands, l10n, window } from "vscode";
import { IResourceMeta } from "../doc";
import { CICSRegionsContainer, CICSResourceContainerNode } from "../trees";
import { CICSLogger } from "./CICSLogger";
import { ProfileManagement } from "./profileManagement";

const MAX_MODAL_LIST_ITEMS = 10;
/**
 * Checks if a profile supports a specific type of connection
 *
 * @param profile - The profile to check
 * @param connectionType - The type of connection to check for (ZoweExplorerApiType.Uss, ZoweExplorerApiType.Jes, or ZoweExplorerApiType.Mvs)
 * @returns True if the profile supports the specified connection type, false otherwise
 */
export function doesProfileSupportConnectionType(profile: IProfileLoaded, connectionType: ZoweExplorerApiType): boolean {
  const explorerApi = ZoweVsCodeExtension.getZoweExplorerApi();

  try {
    switch (connectionType) {
      case ZoweExplorerApiType.Uss:
        explorerApi.getUssApi(profile);
        break;
      case ZoweExplorerApiType.Jes:
        explorerApi.getJesApi(profile);
        break;
      case ZoweExplorerApiType.Mvs:
        explorerApi.getMvsApi(profile);
        break;
      default:
        return false;
    }
    return true;
  } catch {
    CICSLogger.debug(`Profile ${profile.name} does not support connection type ${connectionType}`);
    return false;
  }
}

/**
 * Fetches a base profile without throwing an error if none exists
 *
 * @param profile - The profile to fetch the base profile for
 * @returns The base profile or undefined if none exists
 */
export async function fetchBaseProfileWithoutError(profile: IProfileLoaded): Promise<IProfileLoaded | undefined> {
  let baseProfile = undefined;
  try {
    baseProfile = await ProfileManagement.getProfilesCache().fetchBaseProfile(profile.name);
  } catch (ex) {
    // this isn't an error we're interested in - we were checking if a base profile existed
    CICSLogger.debug(`No base profile found for ${profile.name}`);
  }
  return baseProfile;
}

/**
 * Finds a related z/OS profile that can be used with a CICS profile
 *
 * This function attempts to find a matching z/OS profile using the following strategy:
 * 1. First tries to find profiles that share the same base profile
 * 2. If no match is found, looks for profiles with the same hostname
 *
 * @param cicsProfile - The CICS profile to find a related z/OS profile for
 * @param zosProfiles - Array of available z/OS profiles to search through
 * @returns A matching z/OS profile or undefined if no match is found
 */
export async function findRelatedZosProfiles(cicsProfile: IProfileLoaded, zosProfiles: IProfileLoaded[]): Promise<IProfileLoaded | undefined> {
  const baseForCicsProfile = await fetchBaseProfileWithoutError(cicsProfile);

  // Prioritize zosmf profiles and filter to only include profiles with credentials
  const prioritizedProfiles = zosProfiles.sort((prof) => (prof.profile.type === "zosmf" ? -1 : 1)).filter((prof) => prof.profile.user);

  // First attempt: Find profiles that share the same base profile
  if (baseForCicsProfile) {
    const matchingBaseProfiles = [];

    for (const profile of prioritizedProfiles) {
      const profileBase = await fetchBaseProfileWithoutError(profile);

      if (profileBase?.name === baseForCicsProfile.name) {
        matchingBaseProfiles.push(profile);
      }
    }

    if (matchingBaseProfiles.length > 0) {
      const selectedProfile = matchingBaseProfiles[0];
      CICSLogger.info(`Located matching z/OS profile by base profile: ${selectedProfile.name}`);
      return selectedProfile;
    }
  }

  // Second attempt: Find profiles with the same hostname
  const sameHostProfile = prioritizedProfiles.find((profile) => cicsProfile.profile.host === profile.profile.host);

  if (sameHostProfile) {
    CICSLogger.info(`Located matching z/OS profile by hostname: ${sameHostProfile.name}`);
    return sameHostProfile;
  }

  // No matching profile found
  return undefined;
}

/**
 * Prompts the user to select a profile from a list
 *
 * @param zosProfiles - Array of profiles to choose from
 * @returns The name of the selected profile, null if no profiles are available, or undefined if the user cancels
 */
export async function promptUserForProfile(zosProfiles: IProfileLoaded[]): Promise<string> {
  const profileNames = zosProfiles.map((profile) => profile.name);

  if (profileNames.length === 0) {
    return null;
  }
  // ask the user to pick from the profiles passed in
  const quickPickOptions: QuickPickOptions = {
    placeHolder: l10n.t("Select a profile to access the logs"),
    ignoreFocusOut: true,
    canPickMany: false,
  };
  const chosenProfileName = await Gui.showQuickPick(profileNames, quickPickOptions);
  if (!chosenProfileName) {
    return chosenProfileName;
  }
  // if the profile they picked doesn't have credentials, prompt the user for them
  const chosenProfileLoaded = zosProfiles.filter((profile) => profile.name === chosenProfileName)[0];
  const chosenProfile = chosenProfileLoaded.profile;
  if (!(chosenProfile.user || chosenProfile.certFile || chosenProfile.tokenValue)) {
    CICSLogger.info(`Prompting for credentials for ${chosenProfileName}`);
    await ZoweVsCodeExtension.updateCredentials(
      {
        profile: chosenProfileLoaded,
        rePrompt: false,
      },
      ProfileManagement.getExplorerApis()
    );
  }
  // call fetchAllProfiles again otherwise we get an expect error about requiring a session to be defined
  const requestTheProfileAgain = (await ProfileManagement.getProfilesCache().fetchAllProfiles()).filter((prof) => prof.name === chosenProfileName)[0];
  return requestTheProfileAgain.name;
}

/**
 * @param cicsProfile - The CICS profile to find a related z/OS profile for
 * @param jobid - The job ID to show logs for
 * @param regionName - The region name (used for logging and error messages)
 * @returns Promise that resolves when the command is executed or rejects on error
 */
export async function findProfileAndShowJobSpool(cicsProfile: IProfileLoaded, jobid: string, regionName: string): Promise<void> {
  const allProfiles = await ProfileManagement.getProfilesCache().fetchAllProfiles();
  // do not include the FTP profile because it doesn't support spools for running jobs.
  const zosProfiles = allProfiles.filter(
    (element) => !["zftp"].includes(element.type) && doesProfileSupportConnectionType(element, ZoweExplorerApiType.Jes)
  );

  let chosenProfileName: string;

  // find profiles that match by base profile or hostname, and have valid credentials
  const matchingZosProfile = await findRelatedZosProfiles(cicsProfile, zosProfiles);
  if (matchingZosProfile) {
    chosenProfileName = matchingZosProfile.name;
  } else {
    chosenProfileName = await promptUserForProfile(zosProfiles);
    CICSLogger.debug(`User picked z/OS profile: ${chosenProfileName}`);
    if (chosenProfileName === null) {
      window.showErrorMessage(l10n.t("Could not find any profiles that will access JES (for instance z/OSMF)."));
      return;
    } else if (chosenProfileName === undefined) {
      return;
    }
  }
  CICSLogger.info(`Calling zowe.jobs.setJobSpool for region ${regionName}: ${chosenProfileName} / ${jobid}`);
  commands.executeCommand("zowe.jobs.setJobSpool", chosenProfileName, jobid);
}

/**
 * Finds a related z/OS profile and shows a dataset in Zowe Explorer
 * @param cicsProfile - The CICS profile to find a related z/OS profile for
 * @param datasetName - The dataset name to show
 * @param regionName - The region name (used for logging and error messages)
 * @returns Promise that resolves when the command is executed or rejects on error
 */
export async function findProfileAndShowDataSet(cicsProfile: IProfileLoaded, datasetName: string, regionName: string): Promise<void> {
  // Check if the zowe.ds.setDataSetFilter command is available
  const availableCommands = await commands.getCommands();
  // if (!availableCommands.includes("zowe.ds.setDataSetFilter")) {
  //   CICSLogger.debug("zowe.ds.setDataSetFilter command is not available");
  //   window.showWarningMessage(
  //     l10n.t("The dataset hyperlink feature requires Zowe Explorer with the 'zowe.ds.setDataSetFilter' command. Please update Zowe Explorer to use this feature.")
  //   );
  //   return;
  // }

  const allProfiles = await ProfileManagement.getProfilesCache().fetchAllProfiles();
  // Filter profiles that support MVS/Dataset operations
  const zosProfiles = allProfiles.filter(
    (element) => !["zftp"].includes(element.type) && doesProfileSupportConnectionType(element, ZoweExplorerApiType.Mvs)
  );

  let chosenProfileName: string;

  // find profiles that match by base profile or hostname, and have valid credentials
  const matchingZosProfile = await findRelatedZosProfiles(cicsProfile, zosProfiles);
  if (matchingZosProfile) {
    chosenProfileName = matchingZosProfile.name;
  } else {
    chosenProfileName = await promptUserForProfile(zosProfiles);
    CICSLogger.debug(`User picked z/OS profile: ${chosenProfileName}`);
    if (chosenProfileName === null) {
      window.showErrorMessage(l10n.t("Could not find any profiles that will access Data Sets (for instance z/OSMF)."));
      return;
    } else if (chosenProfileName === undefined) {
      return;
    }
  }
  CICSLogger.info(`Calling zowe.ds.setDataSetFilter for region ${regionName}: ${chosenProfileName} / ${datasetName}`);
  commands.executeCommand("zowe.ds.setDataSetFilter", chosenProfileName, datasetName);
}

/**
 * Returns an array of selected nodes in the current treeview.
 * @param treeview - Tree View of the required view
 * @param instanceOf - Instance of the node to include in the selection
 * @param clickedNode - Node that was clicked right before the command was executed
 * @return Array of selected nodes in the treeview.
 */
export function findSelectedNodes(
  treeview: TreeView<CICSResourceContainerNode<IResource>>,
  expectedMeta: IResourceMeta<IResource>,
  clickedNode?: CICSResourceContainerNode<IResource>
): CICSResourceContainerNode<IResource>[] {
  /**
   * - Clicked node NOT in selection => return clicked node only
   * - Clicked node in selection => return selection [filtered by meta]
   * - NOT clicked node => return selection as run from cmd palette [filtered by meta]
   */

  const selectedNodes = treeview.selection;

  if (!clickedNode) {
    return selectedNodes?.filter((node) => node.getContainedResource().meta.resourceName === expectedMeta.resourceName);
  }

  if (selectedNodes?.includes(clickedNode)) {
    return selectedNodes.filter((node) => node.getContainedResource().meta.resourceName === expectedMeta.resourceName);
  } else {
    return [clickedNode];
  }
}

/**
 * Split error messages from Zowe CICS plugin's Cmci REST client
 * @param message
 * @returns
 */
export function splitCmciErrorMessage(message: any) {
  const messageArr = message.split(" ").join("").split("\n");
  let resp;
  let resp2;
  let respAlt;
  let eibfnAlt;
  for (const val of messageArr) {
    const values = val.split(":");
    if (values[0] === "resp") {
      resp = values[1];
    } else if (values[0] === "resp2") {
      resp2 = values[1];
    } else if (values[0] === "resp_alt") {
      respAlt = values[1];
    } else if (values[0] === "eibfn_alt") {
      eibfnAlt = values[1];
    }
  }
  return [resp, resp2, respAlt, eibfnAlt];
}

export function toArray<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}

export async function getResourceTree<T extends IResource>(
  treeview: TreeView<any>,
  nodes: any[],
  targetResourceName: string
): Promise<CICSResourceContainerNode<T> | undefined> {
  let regionName = nodes[0].description?.toString() ?? "";

  if (regionName.length > 0) {
    regionName = regionName.match(/\(([^)]*)\)/)?.[1]?.trim() ?? regionName;

    const regionsNode = nodes[0]
      .getParent()
      .getParent()
      .children.find((ch: any) => ch.label.toString().includes("Regions")) as CICSRegionsContainer;

    if (!regionsNode) {
      return;
    }
    await treeview.reveal(regionsNode, { expand: true });

    const regionTree = regionsNode.children.find((ch: any) => ch.label === regionName);
    if (!regionTree) {
      return;
    }

    await treeview.reveal(regionTree, { expand: true });

    const resourceTree = regionTree.children.find((child: CICSResourceContainerNode<IResource>) =>
      child.resourceTypes.map((type) => type.resourceName).includes(targetResourceName)
    ) as CICSResourceContainerNode<T>;

    return resourceTree;
  }

  throw new Error(l10n.t("Region name is missing in the node description."));
}

export async function getConfirmationForAction(action: string, resourceType: string, resourceNames: string[]) {
  return window.showInformationMessage(
    l10n.t("Are you sure you want to {0} the following {1}?", action, resourceType),
    { modal: true, detail: resourceNames.join("\n") },
    action
  );
}

export const buildConfirmationDescription = (nodes: CICSResourceContainerNode<IResource>[]) => {
  return nodes.length <= MAX_MODAL_LIST_ITEMS ?
      nodes.map((n) => `${n.label}`)
    : [...nodes.slice(0, MAX_MODAL_LIST_ITEMS).map((n) => `${n.label}`), l10n.t("...{0} more", nodes.length - MAX_MODAL_LIST_ITEMS)];
};
