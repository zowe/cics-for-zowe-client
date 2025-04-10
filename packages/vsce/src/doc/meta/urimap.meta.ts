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
import { PersistentStorage } from "../../utils/PersistentStorage";
import { IURIMap } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

export const URIMapMeta: IResourceMeta<IURIMap> = {
  resourceName: CicsCmciConstants.CICS_URIMAP,
  humanReadableName: "URI Maps",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_URIMAP);
  },

  getLabel: function (resource: Resource<IURIMap>): string {
    let label = `${resource.attributes.name}`;

    if (resource.attributes.scheme) {
      label += ` [${resource.attributes.scheme}]`;
    }
    if (resource.attributes.path) {
      label += ` (${resource.attributes.path})`;
    }

    return label;
  },

  getContext: function (resource: Resource<IURIMap>): string {
    return `${CicsCmciConstants.CICS_URIMAP}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<IURIMap>): string {
    return "uri-map";
  },

  getName(resource: Resource<IURIMap>): string {
    return resource.attributes.name;
  },
};
