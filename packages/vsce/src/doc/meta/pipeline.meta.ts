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
import { IPipeline } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

const persistentStorage = new PersistentStorage("zowe.cics.persistent");

export const PipelineMeta: IResourceMeta<IPipeline> = {
  resourceName: CicsCmciConstants.CICS_PIPELINE_RESOURCE,
  humanReadableName: "Pipelines",
  humanReadableNameSingular: "Pipeline",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  async getDefaultCriteria () {
    return PersistentStorage.getDefaultFilter(CicsCmciConstants.CICS_PIPELINE_RESOURCE, "pipeline");
  },

  getLabel: function (resource: Resource<IPipeline>): string {
    return `${resource.attributes.name}`;
  },

  getContext: function (resource: Resource<IPipeline>): string {
    return `${CicsCmciConstants.CICS_PIPELINE_RESOURCE}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<IPipeline>): string {
    return "pipeline";
  },

  getName(resource: Resource<IPipeline>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<IPipeline>) {
    return [];
  },

  async appendCriteriaHistory(criteria: string) {
    await persistentStorage.addPipelineSearchHistory(criteria);
  },

  getCriteriaHistory() {
    return persistentStorage.getPipelineSearchHistory();
  },
};
