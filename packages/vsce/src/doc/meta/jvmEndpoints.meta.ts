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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";
import { IJVMEndpoint } from "../resources/IJVMEndpoint";
import { IJVMServer } from "../resources/IJVMServer";


export const JVMEndpointMeta: IResourceMeta<IJVMEndpoint> = {
  resourceName: CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT,
  humanReadableNamePlural: "JVM Endpoints",
  humanReadableNameSingular: "JVM Endpoint",

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

  getLabel: function (jvmEndpoint: Resource<IJVMEndpoint>): string {
    return `${jvmEndpoint.attributes.jvmendpoint}`;
  },

  getContext: function (jvmEndpoint: Resource<IJVMEndpoint>): string {
    return `${CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT
      }.${jvmEndpoint.attributes.enablestatus.trim().toUpperCase()}.${jvmEndpoint.attributes.jvmendpoint}`;
  },

  getIconName: function (_jvmEndpoint: Resource<IJVMEndpoint>): string {
    return `jvm-endpoint`;
  },

  getName(jvmEndpoint: Resource<IJVMEndpoint>) {
    return jvmEndpoint.attributes.jvmendpoint;
  },

  getHighlights(jvmEndpoint: Resource<IJVMEndpoint>) {
    return [
      {
        key: "Jvmendpoint",
        value: jvmEndpoint.attributes.jvmendpoint,
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
  maximumPrimaryKeyLength: 255,
};
