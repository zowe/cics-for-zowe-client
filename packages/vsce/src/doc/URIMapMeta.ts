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

import { IUriMap } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const URIMapMeta: ResourceMeta<IUriMap> = {

  resourceName: "CICSURIMap",
  humanReadableName: "URI Maps",
  contextPrefix: "cicstreeurimaps",
  combinedContextPrefix: "cicscombinedurimapstree",
  filterAttribute: "NAME",
  primaryKeyAttribute: "name",

  persistentStorageKey: "urimaps",
  persistentStorageAllKey: "allURIMaps",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.URIMAP_FILTER);
  },

  getLabel: function (urimap: IUriMap): string {
    let label = `${urimap.name}`;

    if (urimap.scheme) {
      label += ` [${urimap.scheme}]`;
    }
    if (urimap.path) {
      label += ` (${urimap.path})`;
    }

    return label;
  },

  getContext: function (urimap: IUriMap): string {
    return `cicsurimaps.${urimap.name}`;
  },

  getIconName: function (_urimap: IUriMap): string {
    return `program`;
  }

};

