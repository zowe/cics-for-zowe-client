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

import { IWebService } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const WebServiceMeta: IResourceMeta<IWebService> = {
  resourceName: CicsCmciConstants.CICS_WEBSERVICE_RESOURCE,
  humanReadableNamePlural: l10n.t("Web Services"),
  humanReadableNameSingular: l10n.t("Web Service"),
  eibfnName: "WEBSERVICE",
  setCommandDocFile: "dfha8_setwebservice.html",
  anchorFragmentForSet: "dfhe4_spi_set_webservice__title__6",

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

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  getIconName: function (resource: Resource<IWebService>): string {
    return "web-services";
  },

  getName(resource: Resource<IWebService>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<IWebService>) {
    return [
      {
        key: l10n.t("Status"),
        value: resource.attributes.state,
      },
      {
        key: l10n.t("WS Bind"),
        value: resource.attributes.wsbind,
      },
      {
        key: l10n.t("Program"),
        value: resource.attributes.program,
      },
      {
        key: l10n.t("Pipeline"),
        value: resource.attributes.pipeline,
      },
      {
        key: l10n.t("URI Map"),
        value: resource.attributes.urimap,
      },
      {
        key: l10n.t("Container"),
        value: resource.attributes.container,
      },
      {
        key: l10n.t("WSDL File"),
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
