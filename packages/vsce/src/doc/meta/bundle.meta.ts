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
import { IBundle } from "../resources";
import { BundlePartMeta } from "./bundlePart.meta";
import { IResourceMeta } from "./IResourceMeta";

export const BundleMeta: IResourceMeta<IBundle> = {
  resourceName: CicsCmciConstants.CICS_CMCI_BUNDLE,
  humanReadableName: "Bundles",

  getDefaultFilter: function (): string {
    return "name=*";
  },

  getLabel: function (bundle: Resource<IBundle>): string {
    let label = `${bundle.attributes.name}`;

    if (bundle.attributes.enablestatus.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }

    return label;
  },

  getContext: function (bundle: Resource<IBundle>): string {
    let context = `${CicsCmciConstants.CICS_CMCI_BUNDLE}.${bundle.attributes.name}`;
    if (bundle.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      context += `.disabled`;
    }
    return context;
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

  childType: BundlePartMeta,
};
