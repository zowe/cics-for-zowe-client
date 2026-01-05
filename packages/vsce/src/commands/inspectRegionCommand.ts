import { commands, ExtensionContext } from "vscode";
import { inspectResource, inspectResourceByName } from "./inspectResourceCommandUtils";

export function getInspectRegiobnCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.inspectRegion", async (regionName?: string) => {
    if (regionName) {
      await inspectResourceByName(context, regionName, "region");
    } else {
      await inspectResource(context);
    }
  });
}
