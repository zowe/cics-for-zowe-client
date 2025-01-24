import { IPipeline } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const PipelineMeta: ResourceMeta<IPipeline> = {

  resourceName: "CICSPipeline",
  humanReadableName: "Pipelines",
  contextPrefix: "cicstreepipeline",
  combinedContextPrefix: "cicscombinedpipelinetree",
  filterAttribute: "NAME",
  primaryKeyAttribute: "name",

  persistentStorageKey: "pipelines",
  persistentStorageAllKey: "allPipelines",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.PIPELINE_FILTER);
  },

  getLabel: function (pipeline: IPipeline): string {
    const label = `${pipeline.name}`;
    return label;
  },

  getContext: function (pipeline: IPipeline): string {
    return `cicspipeline.${pipeline.name}`;
  },

  getIconName: function (_pipeline: IPipeline): string {
    return `program`;
  }

};

