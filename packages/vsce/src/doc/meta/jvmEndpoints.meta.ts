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

import { IJVMEndpoint, IJVMServer } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const JVMEndpointMeta: IResourceMeta<IJVMEndpoint> = {
  resourceName: CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT,
  humanReadableNamePlural: l10n.t("JVM Endpoints"),
  humanReadableNameSingular: l10n.t("JVM Endpoint"),
  eibfnName: "JVMENDPOINT",
  queryParamForSet: "commands-set-jvmendpoint",
  anchorFragmentForSet: "setjvmendpoint__title__6",

  buildCriteria(criteria: string[], parentResource?: IJVMServer) {
    let criteriaString = `(${criteria.map((n) => `JVMENDPOINT='${n}'`).join(" OR ")})`;
    if (parentResource) {
      criteriaString += ` AND (JVMSERVER='${parentResource.name}')`;
    }
    return criteriaString;
  },

  getDefaultCriteria: function (parentResource: IJVMServer) {
    return `JVMSERVER='${parentResource.name}'`;
  },

  getLabel(resource: Resource<IJVMEndpoint>): string {
    let label = `${resource.attributes.jvmendpoint}`;
    const secport = resource.attributes.secport;
    const port = resource.attributes.port;

    if (secport && secport !== "N/A" && port && port !== "N/A") {
      label += ` (🔒${secport} / ${port})`;
    } else if (secport && secport !== "N/A") {
      label += ` (🔒${secport})`;
    } else if (port && port !== "N/A") {
      label += ` (${port})`;
    }
    if (resource.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }
    return label;
  },

  getContext(resource: Resource<IJVMEndpoint>): string {
    return `${CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT}.${resource.attributes.enablestatus.trim().toUpperCase()}.${resource.attributes.jvmendpoint}`;
  },

  getIconName(resource: Resource<IJVMEndpoint>): string {
    let iconName = `jvm-server-endpoint`;
    if (resource.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(resource: Resource<IJVMEndpoint>): string {
    return resource.attributes.jvmendpoint;
  },

  getHighlights(resource: Resource<IJVMEndpoint>) {
    return [
      {
        key: l10n.t("Status"),
        value: resource.attributes.enablestatus,
      },
      {
        key: l10n.t("Port"),
        value: resource.attributes.port,
      },
      {
        key: l10n.t("Secure Port"),
        value: resource.attributes.secport,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT);
  },

  filterCaseSensitive: true,
  maximumPrimaryKeyLength: 224,
};
