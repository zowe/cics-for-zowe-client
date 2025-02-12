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
import { TransactionMeta } from "../../../src/doc/TransactionMeta";

describe("Transaction Meta", () => {

  let transactionMock: ITransaction;

  beforeEach(() => {
    transactionMock = {
      tranid: "TRAN",
      eyu_cicsname: "MYREG",
      program: "MYPROG",
      status: "ENABLED"
    };
  });

  it("should return label", () => {
    const label = TransactionMeta.getLabel(transactionMock);
    expect(label).toEqual(`TRAN`);
  });
  it("should return label with disabled", () => {
    transactionMock.status = "DISABLED";
    const label = TransactionMeta.getLabel(transactionMock);
    expect(label).toEqual(`TRAN (Disabled)`);
  });

  it("should return context", () => {
    const context = TransactionMeta.getContext(transactionMock);
    expect(context).toEqual(`cicstransaction.enabled.TRAN`);
  });
  it("should return context with disabled", () => {
    transactionMock.status = "DISABLED";
    const context = TransactionMeta.getContext(transactionMock);
    expect(context).toEqual(`cicstransaction.disabled.TRAN`);
  });

  it("should return icon name", () => {
    const iconName = TransactionMeta.getIconName(transactionMock);
    expect(iconName).toEqual(`local-transaction`);
  });
  it("should return icon name with disabled", () => {
    transactionMock.status = "DISABLED";
    const iconName = TransactionMeta.getIconName(transactionMock);
    expect(iconName).toEqual(`local-transaction-disabled`);
  });
});
