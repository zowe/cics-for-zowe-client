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

import { IJVMServer } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";
import { JVMEndpointMeta } from "./jvmEndpoints.meta";

export const JVMServerMeta: IResourceMeta<IJVMServer> = {
  resourceName: CicsCmciConstants.CICS_JVMSERVER_RESOURCE,
  humanReadableNamePlural: l10n.t("JVM Servers"),
  humanReadableNameSingular: l10n.t("JVM Server"),
  eibfnName: "JVMSERVER",
  queryParamForSet: "commands-set-jvmserver",
  anchorFragmentForSet: "dfha8_setenclave__title__6",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_JVMSERVER_RESOURCE, "jvmServer");
  },

  getLabel(resource: Resource<IJVMServer>): string {
    let label = `${resource.attributes.name}`;

    if (resource.attributes.enablestatus.trim().toLowerCase() !== "enabled") {
      const status = resource.attributes.enablestatus.trim().toLowerCase();
      label += ` (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
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
        key: l10n.t("Status"),
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
  childType: [JVMEndpointMeta],
};
