import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { commands, ExtensionContext } from "vscode";
import { setLastUsedRegion } from "../utils/lastUsedRegionUtils";
import { inspectRegionByName } from "./inspectResourceCommandUtils";
import { setCICSRegion } from "./setCICSRegionCommand";

export function getInspectRegionCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.inspectRegion", async () => {
    const newRegion = await setCICSRegion(true);
    if (!newRegion) {
      return;
    }

    await setLastUsedRegion(newRegion.regionName, newRegion.profile.name, newRegion.cicsPlexName);

    const overrideContext = {
      profileName: newRegion.profile.name,
      cicsplexName: newRegion.cicsPlexName,
      regionName: newRegion.regionName,
    };
    await inspectRegionByName(context, newRegion.regionName, CicsCmciConstants.CICS_CMCI_MANAGED_REGION, overrideContext);
  });
}
