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
import { IJVMServer } from "../resources/IJVMServer";
import { IResourceMeta } from "./IResourceMeta";

export const JVMServerMeta: IResourceMeta<IJVMServer> = {
  resourceName: CicsCmciConstants.CICS_CMCI_JVM_SERVER,
  humanReadableName: "JVM Servers",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_CMCI_JVM_SERVER);
  },

  getLabel: function (jvmserver: Resource<IJVMServer>): string {
    let label = `${jvmserver.attributes.name}`;

    if (jvmserver.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }

    return label;
  },

  getContext: function (jvmserver: Resource<IJVMServer>): string {
    return `${CicsCmciConstants.CICS_CMCI_JVM_SERVER}.${jvmserver.attributes.enablestatus.trim().toUpperCase()}.${jvmserver.attributes.name}`;
  },

  getIconName: function (jvmserver: Resource<IJVMServer>): string {
    let iconName = `jvmserver`;
    if (jvmserver.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(jvmserver: Resource<IJVMServer>) {
    return jvmserver.attributes.name;
  },
};
