import { IResourceContext, ResourceAction, ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";
import { IRegion } from "../../doc";

const actions: ResourceActionOptions<ResourceTypes.CICSManagedRegion>[] = [
  {
    id: "CICS.CICSRegion.SHOWREGIONLOGS",
    name: l10n.t("Show Region Logs"),
    resourceType: ResourceTypes.CICSManagedRegion,
    visibleWhen: (region: IRegion, _cx: IResourceContext) => region.cicsstate !== "INACTIVE",
    action: "cics-extension-for-zowe.showRegionLogs",
  },
  {
    id: "CICS.CICSRegion.SHOWSITPARAMETERS",
    name: l10n.t("Show SIT Parameters"),
    resourceType: ResourceTypes.CICSManagedRegion,
    visibleWhen: (region: IRegion, _cx: IResourceContext) => region.cicsstate !== "INACTIVE",
    action: "cics-extension-for-zowe.showRegionParameters",
  },
];

export function getManagedRegionActions(): ResourceAction<ResourceTypes.CICSManagedRegion>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSManagedRegion>(action));
}
