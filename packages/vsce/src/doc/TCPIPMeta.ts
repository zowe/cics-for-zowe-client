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

