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
import { IBundle, IBundlePart } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

export const BundlePartMeta: IResourceMeta<IBundlePart> = {
  resourceName: CicsCmciConstants.CICS_CMCI_BUNDLE_PART,
  humanReadableName: "Bundle Parts",

  buildCriteria(criteria: string[], parentResource?: IBundle) {
    return `BUNDLE=${parentResource.name} AND (${criteria.map((n) => `BUNDLEPART=${n}`).join(" OR ")})`;
  },

  getDefaultCriteria: function (parentResource: IBundle): string {
    return `BUNDLE='${parentResource.name}'`;
  },

  getLabel: function (bundlePart: Resource<IBundlePart>): string {
    let label = `${bundlePart.attributes.bundlepart}`;

    if (bundlePart.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }

    return label;
  },

  getContext: function (bundlePart: Resource<IBundlePart>): string {
    return `${CicsCmciConstants.CICS_CMCI_BUNDLE_PART}.${bundlePart.attributes.enablestatus.trim().toUpperCase()}.${bundlePart.attributes.bundlepart}`;
  },

  getIconName: function (bundlePart: Resource<IBundlePart>): string {
    let iconName = `bundle-part`;
    if (bundlePart.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(bundlePart: Resource<IBundlePart>) {
    return bundlePart.attributes.bundlepart;
  },
};
