import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { Resource } from "../../resources/Resource";
import { PersistentStorage } from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";
import { IJVMServer } from "../resources/IJVMServer";

const persistentStorage = new PersistentStorage("zowe.cics.persistent");

export const JVMServerMeta: IResourceMeta<IJVMServer> = {
  resourceName: CicsCmciConstants.CICS_JVMSERVER_RESOURCE,
  humanReadableNamePlural: "JVM Servers",
  humanReadableNameSingular: "JVM Server",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `NAME=${n}`).join(" OR ");
  },

  async getDefaultCriteria() {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_JVMSERVER_RESOURCE, "jvmServer");
  },

  getLabel: function (jvmServer: Resource<IJVMServer>): string {
    let label = `${jvmServer.attributes.name}`;
    if (jvmServer.attributes.enablestatus && jvmServer.attributes.enablestatus.toLowerCase() === "disabled") {
      label += " (Disabled)";
    }
    return label;
  },

  getContext: function (jvmServer: Resource<IJVMServer>): string {
    const status = (jvmServer.attributes.enablestatus ?? "").trim().toUpperCase();
    return `${CicsCmciConstants.CICS_JVMSERVER_RESOURCE}.${status}.${jvmServer.attributes.name}`;
  },

  getIconName: function (jvmServer: Resource<IJVMServer>): string {
    let iconName = `jvm-server`;
    const status = (jvmServer.attributes.enablestatus ?? "").trim().toUpperCase();
    if (status === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getHighlights(jvmServer: Resource<IJVMServer>) {
    return [
      {
        key: "Status",
        value: jvmServer.attributes.enablestatus,
      }
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await persistentStorage.addJVMServerSearchHistory(criteria);
  },

  getCriteriaHistory() {
    return persistentStorage.getJVMServerSearchHistory();
  },

  getName(jvmServer: Resource<IJVMServer>): string {
    return jvmServer.attributes.name;
  },
};