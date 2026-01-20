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
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IRegion } from "../resources/IRegion";
import { IResourceMeta } from "./IResourceMeta";

function getFirstAttributeValue(resource: Resource<IRegion>, ...keys: string[]): string {
  for (const key of keys) {
    const value = (resource.attributes as any)[key];
    if (value !== undefined && value !== null && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }
  return "";
}

export const RegionMeta: IResourceMeta<IRegion> = {
  resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
  humanReadableNamePlural: l10n.t("Regions"),
  humanReadableNameSingular: l10n.t("Region"),

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `CICSNAME=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_CMCI_MANAGED_REGION, "region");
  },

  getLabel: function (region: Resource<IRegion>): string {
    const name = getFirstAttributeValue(region, "cicsname", "eyu_cicsname", "EYU_CICSNAME", "jobname", "JOBNAME");
    let label = `${name}`;
    const state = getFirstAttributeValue(region, "cicsstatus", "cicsstate", "status");
    if (state && state.length > 0) {
      if (state.toUpperCase() !== "ACTIVE") {
        label += ` (${state.charAt(0).toUpperCase()}${state.slice(1).toLowerCase()})`;
      }
    }
    return label;
  },

  getContext: function (region: Resource<IRegion>): string {
    const name = getFirstAttributeValue(region, "cicsname", "eyu_cicsname", "EYU_CICSNAME", "jobname", "JOBNAME");
    return `${CicsCmciConstants.CICS_CMCI_MANAGED_REGION}.${name}`;
  },

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  getIconName: function (_region: Resource<IRegion>): string {
    return "region";
  },

  getName(region: Resource<IRegion>): string {
    return getFirstAttributeValue(region, "cicsname", "eyu_cicsname", "EYU_CICSNAME", "jobname", "JOBNAME");
  },

  getHighlights(resource: Resource<IRegion>) {
    const name = getFirstAttributeValue(resource, "cicsname", "eyu_cicsname", "EYU_CICSNAME", "jobname", "JOBNAME");
    const state = getFirstAttributeValue(resource, "cicsstate", "cicsstatus", "status");
    return [
      {
        key: l10n.t("Name"),
        value: name,
      },
      {
        key: l10n.t("CICS State"),
        value: state,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_MANAGED_REGION, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_MANAGED_REGION);
  },
};
