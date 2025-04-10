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
import { IProgram } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

export const ProgramMeta: IResourceMeta<IProgram> = {
  resourceName: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
  humanReadableName: "Programs",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `PROGRAM=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_PROGRAM_RESOURCE);
  },

  getLabel: function (program: Resource<IProgram>): string {
    let label = `${program.attributes.program}`;
    if (program.attributes.newcopycnt && parseInt(program.attributes.newcopycnt) > 0) {
      label += ` (New copy count: ${program.attributes.newcopycnt})`;
    }
    if (program.attributes.status.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }

    return label;
  },

  getContext: function (program: Resource<IProgram>): string {
    return `${CicsCmciConstants.CICS_PROGRAM_RESOURCE}.${program.attributes.status.trim().toUpperCase()}.${program.attributes.program}`;
  },

  getIconName: function (program: Resource<IProgram>): string {
    let iconName = `program`;
    if (program.attributes.status.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(program: Resource<IProgram>): string {
    return program.attributes.program;
  },
};
