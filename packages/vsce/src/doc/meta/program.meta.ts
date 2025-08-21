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
import { IProgram } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

export const ProgramMeta: IResourceMeta<IProgram> = {
  resourceName: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
  humanReadableNamePlural: "Programs",
  humanReadableNameSingular: "Program",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `PROGRAM=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_PROGRAM_RESOURCE, "program");
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

  getHighlights(program: Resource<IProgram>) {
    return [
      {
        key: "Type",
        value: program.attributes.progtype,
      },
      {
        key: "New Copy Count",
        value: program.attributes.newcopycnt,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_PROGRAM_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_PROGRAM_RESOURCE);
  },

  getName(program: Resource<IProgram>): string {
    return program.attributes.program;
  },
};
