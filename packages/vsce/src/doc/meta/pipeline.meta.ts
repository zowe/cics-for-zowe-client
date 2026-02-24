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

import { IPipeline } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";

export const PipelineMeta: IResourceMeta<IPipeline> = {
  resourceName: CicsCmciConstants.CICS_PIPELINE_RESOURCE,
  humanReadableNamePlural: l10n.t("Pipelines"),
  humanReadableNameSingular: l10n.t("Pipeline"),
  eibfnName: "PIPELINE",
  setCommandDocFile: "dfha8_setpipeline.html",
  anchorFragmentForSet: "dfha8bv__conditions",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_PIPELINE_RESOURCE, "pipeline");
  },

  getLabel: function (resource: Resource<IPipeline>): string {
    return `${resource.attributes.name}`;
  },

  getContext: function (resource: Resource<IPipeline>): string {
    return `${CicsCmciConstants.CICS_PIPELINE_RESOURCE}.${resource.attributes.name}`;
  },

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  getIconName: function (resource: Resource<IPipeline>): string {
    return "pipeline";
  },

  getName(resource: Resource<IPipeline>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<IPipeline>) {
    return [
      {
        key: l10n.t("Status"),
        value: resource.attributes.enablestatus,
      },
      {
        key: l10n.t("Soap Level"),
        value: resource.attributes.soaplevel,
      },
      {
        key: l10n.t("WS Directory"),
        value: resource.attributes.wsdir,
      },
      {
        key: l10n.t("Config File"),
        value: resource.attributes.configfile,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_PIPELINE_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_PIPELINE_RESOURCE);
  },
};
