import { getDefaultLocalFileFilter, getDefaultProgramFilter, getDefaultTransactionFilter } from "../utils/filterUtils";
import { buildLocalFileContext, buildLocalFileLabel } from "./ILocalFile";
import { buildProgramContext, buildProgramLabel } from "./IProgram";
import { buildTransactionContext, buildTransactionLabel } from "./ITransaction";

export interface IResource { }

export interface IResourceMeta {
  humanReadableName: string;
  resourceName: string;
  contextPrefix: string;
  combinedContextPrefix: string;
  filterAttribute: string;
  iconFilePrefix: string;
  regionNameAttribute: string;
  primaryKeyAttribute: string;
  getDefaultFilter: () => Promise<string>;
  getLabel: (resource: IResource) => string;
  getContext: (resource: IResource) => string;
}

const resources = {
  program: {
    humanReadableName: "Programs",
    resourceName: "CICSProgram",
    contextPrefix: "cicstreeprogram",
    combinedContextPrefix: "cicscombinedprogramtree",
    filterAttribute: "PROGRAM",
    iconFilePrefix: "program",
    regionNameAttribute: "eyu_cicsname",
    primaryKeyAttribute: "program",
    getDefaultFilter: getDefaultProgramFilter,
    getLabel: buildProgramLabel,
    getContext: buildProgramContext,
  },
  transaction: {
    humanReadableName: "Transactions",
    resourceName: "CICSLocalTransaction",
    contextPrefix: "cicstreetransaction",
    combinedContextPrefix: "cicscombinedtransactiontree",
    filterAttribute: "tranid",
    iconFilePrefix: "local-transaction",
    regionNameAttribute: "eyu_cicsname",
    primaryKeyAttribute: "tranid",
    getDefaultFilter: getDefaultTransactionFilter,
    getLabel: buildTransactionLabel,
    getContext: buildTransactionContext,
  },
  localFile: {
    humanReadableName: "Local Files",
    resourceName: "CICSLocalFile",
    contextPrefix: "cicstreelocalfile",
    combinedContextPrefix: "cicscombinedlocalfiletree",
    filterAttribute: "file",
    iconFilePrefix: "local-file",
    regionNameAttribute: "eyu_cicsname",
    primaryKeyAttribute: "file",
    getDefaultFilter: getDefaultLocalFileFilter,
    getLabel: buildLocalFileLabel,
    getContext: buildLocalFileContext,
  },
};

export default resources;
