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

    const regionContext = {
      profileName: newRegion.profile.name,
      cicsplexName: newRegion.cicsPlexName,
      regionName: newRegion.regionName,
    };

    const regionType = newRegion.cicsPlexName ? ManagedRegionMeta : RegionMeta;
    await inspectRegionByName(context, regionType, regionContext);
  });
}
