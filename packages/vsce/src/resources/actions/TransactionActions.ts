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

import { IResourceAction, IResourceContext, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { ITransaction } from "../../doc";

export function getTransactionActions(): IResourceAction[] {
  return [
    {
      id: "CICS.CICSLocalTransaction.INQUIRE",
      name: "Inquire Program",
      resourceType: ResourceTypes.CICSLocalTransaction,
      action: "cics-extension-for-zowe.inquireProgram",
    },
    {
      id: "CICS.CICSLocalTransaction.ENABLE",
      name: "Enable Transaction",
      resourceType: ResourceTypes.CICSLocalTransaction,
      visibleWhen: (transaction: ITransaction, _cx: IResourceContext) => transaction.status !== "ENABLED",
      action: "cics-extension-for-zowe.enableTransaction",
    },
    {
      id: "CICS.CICSLocalTransaction.DISABLE",
      name: "Disable Transaction",
      resourceType: ResourceTypes.CICSLocalTransaction,
      visibleWhen: (transaction: ITransaction, _cx: IResourceContext) => transaction.status !== "DISABLED",
      action: "cics-extension-for-zowe.disableTransaction",
    },
  ];
}
