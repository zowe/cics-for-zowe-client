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

import { TreeItemCollapsibleState, TreeItem } from "vscode";
import { CICSRegionTree } from "../CICSRegionTree";
import { getIconByStatus } from "../../utils/iconUtils";

export class CICSTransactionTreeItem extends TreeItem {
  transaction: any;
  parentRegion: CICSRegionTree;
  directParent: any;
  transactionName: string;

  constructor(
    transaction: any,
    parentRegion: CICSRegionTree,
    directParent: any,
    public readonly iconPath = getIconByStatus("TRANSACTION", transaction)
  ) {
    super(`${transaction.tranid} ${transaction.status.toLowerCase() === "disabled" ? "(Disabled)" : ""}`, TreeItemCollapsibleState.None);
    this.transaction = transaction;
    this.contextValue = `cicstransaction.${transaction.status.toLowerCase()}.${transaction.tranid}`;
    this.parentRegion = parentRegion;
    this.directParent = directParent;
    this.transactionName = transaction.tranid;
  }

  public setLabel(newLabel: string) {
    this.label = newLabel;
  }

  public getParent() {
    return this.directParent;
  }
}
