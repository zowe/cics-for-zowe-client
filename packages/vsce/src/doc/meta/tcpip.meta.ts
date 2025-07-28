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
import { PersistentStorage } from "../../utils/PersistentStorage";
import { ITCPIP } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

const persistentStorage = new PersistentStorage("zowe.cics.persistent");

export const TCPIPMeta: IResourceMeta<ITCPIP> = {
  resourceName: CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE,
  humanReadableName: "TCP/IP Services",
  humanReadableNameSingular: "TCP/IP Service",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE, "tcpipService");
  },

  getLabel: function (resource: Resource<ITCPIP>): string {
    let label = `${resource.attributes.name}`;

    if (resource.attributes.port) {
      label += ` [Port #${resource.attributes.port}]`;
    }

    return label;
  },

  getContext: function (resource: Resource<ITCPIP>): string {
    return `${CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<ITCPIP>): string {
    return "tcp-ip-service";
  },

  getName(resource: Resource<ITCPIP>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<ITCPIP>) {
    return [
      {
        key: "Port",
        value: resource.attributes.port,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await persistentStorage.addTCPIPSSearchHistory(criteria);
  },

  getCriteriaHistory() {
    return persistentStorage.getTCPIPSSearchHistory();
  },
};
