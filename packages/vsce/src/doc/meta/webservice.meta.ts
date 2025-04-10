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
import { IWebService } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

export const WebServiceMeta: IResourceMeta<IWebService> = {
  resourceName: CicsCmciConstants.CICS_WEBSERVICE_RESOURCE,
  humanReadableName: "Web Services",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_WEBSERVICE_RESOURCE);
  },

  getLabel: function (resource: Resource<IWebService>): string {
    return `${resource.attributes.name}`;
  },

  getContext: function (resource: Resource<IWebService>): string {
    return `${CicsCmciConstants.CICS_WEBSERVICE_RESOURCE}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<IWebService>): string {
    return "web-services";
  },

  getName(resource: Resource<IWebService>): string {
    return resource.attributes.name;
  },
};
