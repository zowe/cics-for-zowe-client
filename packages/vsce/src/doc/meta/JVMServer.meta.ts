import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";
import { IJVMServer } from "../resources/IJVMServer";

export const JVMServerMeta: IResourceMeta<IJVMServer> = {
  resourceName: CicsCmciConstants.CICS_JVMSERVER_RESOURCE,
  humanReadableNamePlural: "JVM Servers",
  humanReadableNameSingular: "JVM Server",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(
      CicsCmciConstants.CICS_JVMSERVER_RESOURCE,
      "jvmServer"
    );
  },

  getLabel(resource: Resource<IJVMServer>): string {
    let label = `${resource.attributes.name}`;
    if (resource.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }
    return label;
  },

  getContext(resource: Resource<IJVMServer>): string {
    return `${CicsCmciConstants.CICS_JVMSERVER_RESOURCE}.${resource.attributes.enablestatus.trim().toUpperCase()}.${resource.attributes.name}`;
  },

  getIconName(resource: Resource<IJVMServer>): string {
    let iconName = `jvm-server`;
    if (resource.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(resource: Resource<IJVMServer>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<IJVMServer>) {
    return [
      {
        key: "Status",
        value: resource.attributes.enablestatus,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_JVMSERVER_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_JVMSERVER_RESOURCE);
  },
};
