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

import type { IManagedRegion } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import type { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import type { IResourceMeta } from "./IResourceMeta";

export const ManagedRegionMeta: IResourceMeta<IManagedRegion> = {
  resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
  humanReadableNamePlural: l10n.t("Regions"),
  humanReadableNameSingular: l10n.t("Region"),

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `CICSNAME=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_CMCI_MANAGED_REGION, "managedregion");
  },

  getLabel: function (region: Resource<IManagedRegion>): string {
    const label = `${region.attributes.cicsname}`;
    return label;
  },

  getContext: function (region: Resource<IManagedRegion>): string {
    return `${CicsCmciConstants.CICS_CMCI_MANAGED_REGION}.${region.attributes.cicsname}`;
  },

  getIconName: function (_region: Resource<IManagedRegion>): string {
    return "region";
  },

  getName(region: Resource<IManagedRegion>): string {
    return region.attributes.cicsname;
  },

  getHighlights(resource: Resource<IManagedRegion>) {
    return [
      {
        key: l10n.t("CICS Name"),
        value: resource.attributes.cicsname,
      },
      {
        key: l10n.t("CICS State"),
        value: resource.attributes.cicsstate,
      },
      {
        key: l10n.t("Security Bypass"),
        value: resource.attributes.secbypass,
      },
      {
        key: l10n.t("WLM Status"),
        value: resource.attributes.wlmstatus,
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
