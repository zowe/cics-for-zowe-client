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
import { IResourceMeta } from "./IResourceMeta";
import { ITCPIP } from "../resources";

export const TCPIPMeta: IResourceMeta<ITCPIP> = {
  resourceName: CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE,
  humanReadableName: "TCPIP Services",

  buildCriteria(criteria: string) {
    return `name=${criteria}`;
  },

  getDefaultCriteria: function (): string {
    return "name=*";
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
  }
};
