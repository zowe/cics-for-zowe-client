import { IResourceContext, ResourceAction, ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";
import { IRegion } from "../../doc";

const actions: ResourceActionOptions<ResourceTypes.CICSRegion>[] = [
  {
    id: "CICS.CICSRegion.SHOWSITPARAMETERS",
    name: l10n.t("Show SIT Parameters"),
    resourceType: ResourceTypes.CICSRegion,
    visibleWhen: (region: IRegion, _cx: IResourceContext) => region.cicsstate !== "INACTIVE",
    action: "cics-extension-for-zowe.showRegionParameters",
  },
  {
    id: "CICS.CICSRegion.SHOWREGIONLOGS",
    name: l10n.t("Show Region Logs"),
    resourceType: ResourceTypes.CICSRegion,
    visibleWhen: (region: IRegion, _cx: IResourceContext) => region.cicsstate !== "INACTIVE",
    action: "cics-extension-for-zowe.showRegionLogs",
  },
];

export function getRegionActions(): ResourceAction<ResourceTypes.CICSRegion>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSRegion>(action));
}
