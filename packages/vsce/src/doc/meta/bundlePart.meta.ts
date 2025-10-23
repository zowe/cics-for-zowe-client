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
import { IBundle, IBundlePart } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceMeta } from "./IResourceMeta";

export const BundlePartMeta: IResourceMeta<IBundlePart> = {
  resourceName: CicsCmciConstants.CICS_CMCI_BUNDLE_PART,
  humanReadableNamePlural: "Bundle Parts",
  humanReadableNameSingular: "Bundle Part",

  buildCriteria(criteria: string[], parentResource?: IBundle) {
    let criteriaString = `(${criteria.map((n) => `BUNDLEPART='${n}'`).join(" OR ")})`;
    if (parentResource) {
      criteriaString += ` AND (BUNDLE='${parentResource.name}')`;
    }
    return criteriaString;
  },

  getDefaultCriteria: function (parentResource: IBundle) {
    return `BUNDLE='${parentResource.name}'`;
  },

  getLabel: function (bundlePart: Resource<IBundlePart>): string {
    let label = `${bundlePart.attributes.bundlepart}`;
    const status = bundlePart.attributes.enablestatus.trim();

    if (status.toUpperCase() !== "ENABLED") {
      label += ` (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
    }

    return label;
  },

  getContext: function (bundlePart: Resource<IBundlePart>): string {
    return `${CicsCmciConstants.CICS_CMCI_BUNDLE_PART
      }.${bundlePart.attributes.enablestatus.trim().toUpperCase()}.${bundlePart.attributes.bundlepart}`;
  },

  getIconName: function (bundlePart: Resource<IBundlePart>): string {
    let iconName = `bundle-part`;

    if (bundlePart.attributes.enablestatus.trim().toUpperCase() !== "ENABLED") {
      iconName += `-disabled`;
    }

    return iconName;
  },

  getName(bundlePart: Resource<IBundlePart>) {
    return bundlePart.attributes.bundlepart;
  },

  getHighlights(bundlePart: Resource<IBundlePart>) {
    return [
      {
        key: "Bundle",
        value: bundlePart.attributes.bundle,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_BUNDLE_PART, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_BUNDLE_PART);
  },

  filterCaseSensitive: true,
  maximumPrimaryKeyLength: 255,
};
