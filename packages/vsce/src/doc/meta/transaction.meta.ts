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
import { ITransaction } from "../resources";
import { IResourceMeta } from "./IResourceMeta";

export const TransactionMeta: IResourceMeta<ITransaction> = {
  resourceName: CicsCmciConstants.CICS_CMCI_LOCAL_TRANSACTION,
  humanReadableNamePlural: "Transactions",
  humanReadableNameSingular: "Transaction",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `TRANID=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_CMCI_LOCAL_TRANSACTION, "transaction");
  },

  getLabel: function (transaction: Resource<ITransaction>): string {
    let label = `${transaction.attributes.tranid}`;

    if (transaction.attributes.status.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }

    return label;
  },

  getContext: function (transaction: Resource<ITransaction>): string {
    return `${CicsCmciConstants.CICS_CMCI_LOCAL_TRANSACTION}.${transaction.attributes.status.trim().toUpperCase()}.${transaction.attributes.tranid}`;
  },

  getIconName: function (transaction: Resource<ITransaction>): string {
    let iconName = `local-transaction`;
    if (transaction.attributes.status.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(transaction: Resource<ITransaction>): string {
    return transaction.attributes.tranid;
  },

  getHighlights(resource: Resource<ITransaction>) {
    return [
      {
        key: "Initial program",
        value: resource.attributes.program,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_CMCI_LOCAL_TRANSACTION, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_CMCI_LOCAL_TRANSACTION);
  },

  maximumPrimaryKeyLength: 4,
};
