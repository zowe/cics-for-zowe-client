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

import { IRegion } from "@zowe/cics-for-zowe-sdk";
import { ResourceMeta } from "./IResourceMeta";


export const RegionMeta: ResourceMeta<IRegion> = {

  resourceName: "CICSManagedRegion",
  humanReadableName: "Regions",
  contextPrefix: "cicsregion",
  combinedContextPrefix: null,
  filterAttribute: "applid",
  primaryKeyAttribute: "applid",

  persistentStorageKey: null,
  persistentStorageAllKey: null,

  getDefaultFilter: function (): Promise<string> {
    return null;
  },

  getLabel: function (region: IRegion): string {
    if (region.applid) {
      return `${region.applid.trim()}`;
    }
    return `${region.cicsname.trim()}`;
  },

  getContext: function (region: IRegion): string {

    let activeContext = `.active`;

    const cicsstate = region.cicsstate?.trim().toUpperCase();
    const cicsstatus = region.cicsstatus?.trim().toUpperCase();

    if ((cicsstate && cicsstate === "INACTIVE") || (cicsstatus && cicsstatus === "INACTIVE")) {
      activeContext = `.inactive`;
    }

    return `cicsregion.${region.applid.trim().toLowerCase()}.${activeContext}`;
  },

  getIconName: function (region: IRegion): string {
    let iconName = `region`;

    const cicsstate = region.cicsstate?.trim().toUpperCase();
    const cicsstatus = region.cicsstatus?.trim().toUpperCase();

    if ((cicsstate && cicsstate === "INACTIVE") || (cicsstatus && cicsstatus === "INACTIVE")) {
      iconName += `-disabled`;
    }
    return iconName;
  }
};

