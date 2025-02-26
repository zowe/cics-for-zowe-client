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

import { ZoweVsCodeExtension, imperative } from "@zowe/zowe-explorer-api";
import { window } from "vscode";
import { ProfileManagement } from "./profileManagement";
import { CICSSessionTree } from "../trees/CICSSessionTree";

export function missingSessionParameters(profileProfile: any): (string | undefined)[] {
  const params = ["host", "port", "user", "password", "rejectUnauthorized", "protocol"];
  const missing: (string | undefined)[] = [];
  for (const value of params) {
    if (profileProfile[value] === undefined) {
      missing.push(value);
    }
  }
  return missing;
}

export function missingUsernamePassword(missingParamters: any): boolean {
  if (missingParamters.length > 0) {
    const userPass = ["user", "password"];
    if (missingParamters.includes(userPass[0]) || missingParamters.includes(userPass[1])) {
      return true;
    }
  }

  return false;
}

export async function updateProfile(profile?: imperative.IProfileLoaded, sessionTree?: CICSSessionTree): Promise<imperative.IProfileLoaded> {
  let missingParamters = missingSessionParameters(profile.profile);
  if (missingUsernamePassword(missingParamters) ||
  // If profile is expanded and it previously had 401 error code
   (sessionTree && sessionTree.getIsUnauthorized())) {

    const updatedProfile = await promptCredentials(profile.name, true);
    if (updatedProfile) {
      profile = updatedProfile;
      // Remove "user" and "password" from missing params array
      missingParamters = missingParamters.filter((param) => ["user", "password"].indexOf(param) === -1);
    }

    if (missingParamters.length) {
      window.showInformationMessage(
        `The following fields are missing from ${profile.name}: ${missingParamters.join(", ")}. Please update them in your config file.`,
      );
    } else {
      return profile;
    }
  }
  return undefined;
}

export async function promptCredentials(sessionName: string, rePrompt?: boolean): Promise<imperative.IProfileLoaded> {
  // const mProfileInfo = new ProfileInfo("zowe", {
  //   requireKeytar: () => getSecurityModules("keytar", isTheia())!,
  // });
  // await mProfileInfo.readProfilesFromDisk();
  // ProfilesCache.createConfigInstance(mProfileInfo);
  const promptInfo = await ZoweVsCodeExtension.updateCredentials({
    sessionName,
    rePrompt,
  }, ProfileManagement.getExplorerApis());
  if (!promptInfo) {
    window.showInformationMessage("Input credentials operation Cancelled");
  }
  return promptInfo;
}
