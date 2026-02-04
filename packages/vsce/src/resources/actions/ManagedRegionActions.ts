import { IResourceContext, ResourceAction, ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";
import { IManagedRegion } from "../../doc";

const actions: ResourceActionOptions<ResourceTypes.CICSManagedRegion>[] = [
  {
    id: "CICS.CICSRegion.SHOWREGIONLOGS",
    name: l10n.t("Show Region Logs"),
    resourceType: ResourceTypes.CICSManagedRegion,
    action: "cics-extension-for-zowe.showRegionLogs",
    visibleWhen: (region: IManagedRegion, _cx: IResourceContext) => region.cicsstate !== "INACTIVE",
    refreshResourceInspector: false,
  },
  {
    id: "CICS.CICSRegion.SHOWSITPARAMETERS",
    name: l10n.t("Show SIT Parameters"),
    resourceType: ResourceTypes.CICSManagedRegion,
    action: "cics-extension-for-zowe.showRegionParameters",
    visibleWhen: (region: IManagedRegion, _cx: IResourceContext) => region.cicsstate !== "INACTIVE",
    refreshResourceInspector: false,
  },
];

export function getManagedRegionActions(): ResourceAction<ResourceTypes.CICSManagedRegion>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSManagedRegion>(action));
}
