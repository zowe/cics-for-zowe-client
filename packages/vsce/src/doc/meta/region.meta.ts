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

import { IRegion } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import type { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import type { IResourceMeta } from "./IResourceMeta";

export const RegionMeta: IResourceMeta<IRegion> = {
  resourceName: CicsCmciConstants.CICS_CMCI_REGION,
  humanReadableNamePlural: l10n.t("Regions"),
  humanReadableNameSingular: l10n.t("Region"),

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `APPLID=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_CMCI_REGION, "region");
  },

  getLabel: function (region: Resource<IRegion>): string {
    const label = `${region.attributes.cicsname}`;
    return label;
  },

  getContext: function (region: Resource<IRegion>): string {
    return `${CicsCmciConstants.CICS_CMCI_REGION}.${region.attributes.cicsname}`;
  },

  getIconName: function (_region: Resource<IRegion>): string {
    return "region";
  },

  getName(region: Resource<IRegion>): string {
    return region.attributes.eyu_cicsname;
  },

  getHighlights(resource: Resource<IRegion>) {
    return [
      {
        key: l10n.t("CICS Name"),
        value: resource.attributes.eyu_cicsname,
      },
      {
        key: l10n.t("Application ID"),
        value: resource.attributes.applid,
      },
      {
        key: l10n.t("Startup"),
        value: resource.attributes.startup,
      },
      {
        key: l10n.t("CICS Status"),
        value: resource.attributes.cicsstatus,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_REGION, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_REGION);
  },
};
