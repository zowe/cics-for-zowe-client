import { ITransaction } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const TransactionMeta: ResourceMeta<ITransaction> = {

  resourceName: "CICSLocalTransaction",
  humanReadableName: "Transactions",
  contextPrefix: "cicstreetransaction",
  combinedContextPrefix: "cicscombinedtransactiontree",
  filterAttribute: "tranid",
  primaryKeyAttribute: "tranid",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.TRANSACTION_FILTER);
  },

  getLabel: function (transaction: ITransaction): string {
    let label = `${transaction.tranid}`;

    if (transaction.status.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }

    return label;
  },

  getContext: function (transaction: ITransaction): string {
    return `cicstransaction.${transaction.status.toLowerCase()}.${transaction.tranid}`;
  },

  getIconName: function (_transaction: ITransaction): string {
    return `local-transaction`;
  }

};

