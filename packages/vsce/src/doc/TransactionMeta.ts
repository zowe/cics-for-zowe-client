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

  persistentStorageKey: "transaction",
  persistentStorageAllKey: "allTransactions",

  getDefaultFilter: function (): Promise<string> {
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

  getIconName: function (transaction: ITransaction): string {
    let iconName = `local-transaction`;
    if (transaction.status.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  }

};

