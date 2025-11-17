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

import { ITransaction } from "@zowe/cics-for-zowe-explorer-api";
import { TransactionMeta } from "../../../src/doc/meta/transaction.meta";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("Transaction Meta", () => {
  let transactionMock: Resource<ITransaction>;

  beforeEach(() => {
    transactionMock = new Resource({
      tranid: "TRAN",
      eyu_cicsname: "MYREG",
      program: "MYPROG",
      status: "ENABLED",
      enablestatus: "ENABLED",
      availstatus: "NONE",
      tranclass: "DFHTCL00",
      routing: "STATIC",
      inquiredProgram:"CEL4RTO"
      
    });
  });

  it("should build criteria", () => {
    const crit = TransactionMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`TRANID=a OR TRANID=b`);
  });
  it("should return label", () => {
    const label = TransactionMeta.getLabel(transactionMock);
    expect(label).toEqual(`TRAN`);
  });
  it("should return label with disabled", () => {
    transactionMock.attributes.status = "DISABLED";
    const label = TransactionMeta.getLabel(transactionMock);
    expect(label).toEqual(`TRAN (Disabled)`);
  });

  it("should return context", () => {
    const context = TransactionMeta.getContext(transactionMock);
    expect(context).toEqual(`CICSLocalTransaction.ENABLED.TRAN`);
  });
  it("should return context with disabled", () => {
    transactionMock.attributes.status = "DISABLED";
    const context = TransactionMeta.getContext(transactionMock);
    expect(context).toEqual(`CICSLocalTransaction.DISABLED.TRAN`);
  });

  it("should return icon name", () => {
    const iconName = TransactionMeta.getIconName(transactionMock);
    expect(iconName).toEqual(`local-transaction`);
  });
  it("should return icon name with disabled", () => {
    transactionMock.attributes.status = "DISABLED";
    const iconName = TransactionMeta.getIconName(transactionMock);
    expect(iconName).toEqual(`local-transaction-disabled`);
  });
  it("should get name", () => {
    const name = TransactionMeta.getName(transactionMock);
    expect(name).toEqual("TRAN");
  });

  it("should return highlights", () => {
    const highlights = TransactionMeta.getHighlights(transactionMock);
    expect(highlights).toEqual([
      
      {
        key: "Status",
        value: "ENABLED",
      },
      {
        key: "Available Status",
        value: "NONE",
      },
      {
        key: "Transaction Class",
        value: "DFHTCL00",
      },
      {
        key: "Routing",
        value: "STATIC",
      },
      {
        key: "Initial program",
        value: "MYPROG",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "TRN1";
    await TransactionMeta.appendCriteriaHistory(criteria);
    let history = TransactionMeta.getCriteriaHistory();
    expect(history).toEqual(["TRN1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "TRN1";
    await TransactionMeta.appendCriteriaHistory(criteria);
    let history = TransactionMeta.getCriteriaHistory();
    expect(history).toEqual(["TRN1"]);
  });
});
