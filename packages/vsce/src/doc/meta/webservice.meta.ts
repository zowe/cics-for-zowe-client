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
import { IResourceMeta } from "./IResourceMeta";
import { IWebService } from "@zowe/cics-for-zowe-explorer-api";

export const WebServiceMeta: IResourceMeta<IWebService> = {
  resourceName: CicsCmciConstants.CICS_WEBSERVICE_RESOURCE,
  humanReadableNamePlural: "Web Services",
  humanReadableNameSingular: "Web Service",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_WEBSERVICE_RESOURCE, "webService");
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

  getHighlights(resource: Resource<IWebService>) {
    return [
      {
        key: "Status",
        value: resource.attributes.state,
      },
      {
        key: "WS Bind",
        value: resource.attributes.wsbind,
      },
      {
        key: "Program",
        value: resource.attributes.program,
      },
      {
        key: "Pipeline",
        value: resource.attributes.pipeline,
      },
      {
        key: "URI Map",
        value: resource.attributes.urimap,
      },
      {
        key: "Container",
        value: resource.attributes.container,
      },
      {
        key: "WSDL File",
        value: resource.attributes.wsdlfile,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_WEBSERVICE_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_WEBSERVICE_RESOURCE);
  },

  maximumPrimaryKeyLength: 32,
};
