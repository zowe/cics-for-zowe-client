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
    let label = `${region.attributes.cicsname}`;
    if (region.attributes.cicsstate && region.attributes.cicsstate.trim().length > 0) {
      const state = region.attributes.cicsstate.trim();
      if (state.toUpperCase() !== "ACTIVE") {
        label += ` (${state.charAt(0).toUpperCase()}${state.slice(1).toLowerCase()})`;
      }
    }
    return label;
  },

  getContext: function (region: Resource<IRegion>): string {
    return `${CicsCmciConstants.CICS_CMCI_MANAGED_REGION}.${region.attributes.cicsname}`;
  },

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  getIconName: function (_region: Resource<IRegion>): string {
    return "region";
  },

  getName(region: Resource<IRegion>): string {
    return region.attributes.cicsname;
  },

  getHighlights(resource: Resource<IRegion>) {
    return [
      {
        key: l10n.t("CICS Status"),
        value: resource.attributes.cicsstatus,
      },
      {
        key: l10n.t("StartUp Type"),
        value: resource.attributes.startup,
      },
      {
        key: l10n.t("Application ID"),
        value: resource.attributes.applid,
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
