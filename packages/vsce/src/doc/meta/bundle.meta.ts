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
import { IBundle } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceMeta } from "./IResourceMeta";
import { BundlePartMeta } from "./bundlePart.meta";

export const BundleMeta: IResourceMeta<IBundle> = {
  resourceName: CicsCmciConstants.CICS_CMCI_BUNDLE,
  humanReadableNamePlural: "Bundles",
  humanReadableNameSingular: "Bundle",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return "name=*";
  },

  getLabel: function (bundle: Resource<IBundle>): string {
    let label = `${bundle.attributes.name}`;

    if (bundle.attributes.enablestatus.trim().toLowerCase() !== "enabled") {
      const status = bundle.attributes.enablestatus.trim();
      label += ` (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
    }

    return label;
  },

  getContext: function (bundle: Resource<IBundle>): string {
    return `${CicsCmciConstants.CICS_CMCI_BUNDLE}.${bundle.attributes.enablestatus.trim().toUpperCase()}.${bundle.attributes.name}`;
  },

  getIconName: function (bundle: Resource<IBundle>): string {
    let iconName = `bundle`;
    if (bundle.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(bundle: Resource<IBundle>) {
    return bundle.attributes.name;
  },

  getHighlights(bundle: Resource<IBundle>) {
    return [
      {
        key: "Bundle Directory",
        value: bundle.attributes.bundledir,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_BUNDLE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_BUNDLE);
  },

  childType: [BundlePartMeta],
};
