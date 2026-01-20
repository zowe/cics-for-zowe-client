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

import { IURIMap } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const URIMapMeta: IResourceMeta<IURIMap> = {
  resourceName: CicsCmciConstants.CICS_URIMAP,
  humanReadableNamePlural: l10n.t("URI Maps"),
  humanReadableNameSingular: l10n.t("URI Map"),
  eibfnName: "URIMAP",
  queryParamForSet: "commands-set-urimap",
  anchorFragmentForSet: "dfha8_seturimap__title__6",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function () {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_URIMAP, "uriMap");
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

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  getIconName: function (resource: Resource<IURIMap>): string {
    return "uri-map";
  },

  getName(resource: Resource<IURIMap>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<IURIMap>) {
    return [
      {
        key: l10n.t("Scheme"),
        value: resource.attributes.scheme,
      },
      {
        key: l10n.t("Transaction"),
        value: resource.attributes.transaction,
      },
      {
        key: l10n.t("Pipeline"),
        value: resource.attributes.pipeline,
      },
      {
        key: l10n.t("Web Service"),
        value: resource.attributes.webservice,
      },
      {
        key: l10n.t("Path"),
        value: resource.attributes.path,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_URIMAP, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_URIMAP);
  },
};
