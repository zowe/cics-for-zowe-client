import { commands, ExtensionContext } from "vscode";
import { inspectResource, inspectResourceByName } from "./inspectResourceCommandUtils";

export function getInspectRegionCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.inspectRegion", async (resourceName?: string, resourceType?: string) => {
    if (resourceName && resourceType) {
      await inspectResourceByName(context, resourceName, resourceType);
    } else {
      await inspectResource(context);
    }
  });
}
