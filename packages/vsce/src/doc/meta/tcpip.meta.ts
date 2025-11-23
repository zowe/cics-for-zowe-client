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

import { ITCPIP } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const TCPIPMeta: IResourceMeta<ITCPIP> = {
  resourceName: CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE,
  humanReadableNamePlural: l10n.t("TCP/IP Services"),
  humanReadableNameSingular: l10n.t("TCP/IP Service"),

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE, "tcpipService");
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
        key: l10n.t("Port"),
        value: resource.attributes.port,
      },
      {
        key: "Transaction ID",
        value: resource.attributes.transid,
      },
      {
        key: "URM",
        value: resource.attributes.urm,
      },
      {
        key: "Protocol",
        value: resource.attributes.protocol,
      },
      {
        key: "ATTLS",
        value: resource.attributes.attls,
      },
      {
        key: "SSL Type",
        value: resource.attributes.ssltype,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE);
  },
};
