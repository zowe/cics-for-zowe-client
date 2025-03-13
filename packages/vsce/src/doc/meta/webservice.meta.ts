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
import { IResourceMeta } from "./IResourceMeta";
import { IWebService } from "../resources";

export const WebServiceMeta: IResourceMeta<IWebService> = {
  resourceName: CicsCmciConstants.CICS_WEBSERVICE_RESOURCE,
  humanReadableName: "Web Services",

  getDefaultFilter: function (): string {
    return "name=*";
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
  }
};
