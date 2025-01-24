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

import { ITCPIP } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const TCPIPMeta: ResourceMeta<ITCPIP> = {

  resourceName: "CICSTCPIPService",
  humanReadableName: "TCPIP Services",
  contextPrefix: "cicstreetcpips",
  combinedContextPrefix: "cicscombinedtcpipstree",
  filterAttribute: "NAME",
  primaryKeyAttribute: "name",

  persistentStorageKey: "tcpips",
  persistentStorageAllKey: "allTCPIPS",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.TCPIP_FILTER);
  },

  getLabel: function (tcpips: ITCPIP): string {
    let label = `${tcpips.name}`;

    if (tcpips.port) {
      label += ` [Port #${tcpips.port}]`;
    }

    return label;
  },

  getContext: function (tcpips: ITCPIP): string {
    return `cicstcpips.${tcpips.name}`;
  },

  getIconName: function (_tcpips: ITCPIP): string {
    return `program`;
  }

};

