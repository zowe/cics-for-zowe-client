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

import { IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const ProgramMeta: IResourceMeta<IProgram> = {
  resourceName: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
  humanReadableNamePlural: l10n.t("Programs"),
  humanReadableNameSingular: l10n.t("Program"),

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
     const result: { key: string; value: string }[] = [];
     result.push({
        key: l10n.t("Status"),
        value: program.attributes.status,
      },)
     if(program.attributes.language!=="NOTDEFINED"){
      result.push({
        key: l10n.t("Language"),
        value: program.attributes.language,
      },)
     }
     result.push({
        key: l10n.t("Use Count"),
        value: program.attributes.usecount,
      },)
      result.push({
        key: l10n.t("Library"),
        value: program.attributes.library,
      },)
    if(program.attributes.jvmserver!==""){
      result.push({
        key: l10n.t("JVM Server"),
        value: program.attributes.jvmserver,
      }
      ,)
    }
    return result;
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
