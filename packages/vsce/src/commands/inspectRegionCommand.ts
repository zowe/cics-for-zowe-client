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
import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { commands, ExtensionContext } from "vscode";
import { ManagedRegionMeta, RegionMeta } from "../doc/meta";
import { inspectRegionByName } from "./inspectResourceCommandUtils";
import { setCICSRegion } from "./setCICSRegionCommand";

export function getInspectRegionCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.inspectRegion", async () => {
    const newRegion = await setCICSRegion();
    if (!newRegion) {
      return;
    }

    const regionContext: IResourceContext = {
      session: newRegion.session,
      profile: newRegion.profile,
      cicsplexName: newRegion.cicsPlexName,
      regionName: newRegion.regionName,
    };

    const regionType = newRegion.cicsPlexName ? ManagedRegionMeta : RegionMeta;
    await inspectRegionByName(context, regionType, regionContext);
  });
}
