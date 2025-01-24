import { getDefaultLocalFileFilter, getDefaultProgramFilter, getDefaultTaskFilter, getDefaultTransactionFilter } from "../utils/filterUtils";
import { buildLocalFileContext, buildLocalFileIconName, buildLocalFileLabel } from "./ILocalFile";
import { buildProgramContext, buildProgramIconName, buildProgramLabel } from "./IProgram";
import { buildTaskContext, buildTaskIconName, buildTaskLabel } from "./ITask";
import { buildTransactionContext, buildTransactionIconName, buildTransactionLabel } from "./ITransaction";

export interface IResource { }

export interface IResourceMeta {
  humanReadableName: string;
  resourceName: string;
  contextPrefix: string;
  combinedContextPrefix: string;
  filterAttribute: string;
  regionNameAttribute: string;
  primaryKeyAttribute: string;
  getDefaultFilter: () => Promise<string>;
  getLabel: (resource: IResource) => string;
  getContext: (resource: IResource) => string;
  getIconName: (resource: IResource) => string;
}

const resources = {
  program: {
    humanReadableName: "Programs",
    resourceName: "CICSProgram",
    contextPrefix: "cicstreeprogram",
    combinedContextPrefix: "cicscombinedprogramtree",
    filterAttribute: "PROGRAM",
    regionNameAttribute: "eyu_cicsname",
    primaryKeyAttribute: "program",
    getDefaultFilter: getDefaultProgramFilter,
    getLabel: buildProgramLabel,
    getContext: buildProgramContext,
    getIconName: buildProgramIconName,
  },
  transaction: {
    humanReadableName: "Transactions",
    resourceName: "CICSLocalTransaction",
    contextPrefix: "cicstreetransaction",
    combinedContextPrefix: "cicscombinedtransactiontree",
    filterAttribute: "tranid",
    regionNameAttribute: "eyu_cicsname",
    primaryKeyAttribute: "tranid",
    getDefaultFilter: getDefaultTransactionFilter,
    getLabel: buildTransactionLabel,
    getContext: buildTransactionContext,
    getIconName: buildTransactionIconName,
  },
  localFile: {
    humanReadableName: "Local Files",
    resourceName: "CICSLocalFile",
    contextPrefix: "cicstreelocalfile",
    combinedContextPrefix: "cicscombinedlocalfiletree",
    filterAttribute: "file",
    regionNameAttribute: "eyu_cicsname",
    primaryKeyAttribute: "file",
    getDefaultFilter: getDefaultLocalFileFilter,
    getLabel: buildLocalFileLabel,
    getContext: buildLocalFileContext,
    getIconName: buildLocalFileIconName,
  },
  task: {
    humanReadableName: "Tasks",
    resourceName: "CICSTask",
    contextPrefix: "cicstreetask",
    combinedContextPrefix: "cicscombinedtasktree",
    filterAttribute: "tranid",
    regionNameAttribute: "eyu_cicsname",
    primaryKeyAttribute: "task",
    getDefaultFilter: getDefaultTaskFilter,
    getLabel: buildTaskLabel,
    getContext: buildTaskContext,
    getIconName: buildTaskIconName,
  },
};

export default resources;
