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

import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { IResource } from "../doc";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";

export class ViewMore extends TreeItem {
  parent: CICSResourceContainerNode<IResource>;

  constructor(parent: CICSResourceContainerNode<IResource>) {
    super(`View more...`, TreeItemCollapsibleState.None);
    this.parent = parent;
    this.contextValue = "viewmore.";
    this.command = {
      title: "View more",
      command: "cics-extension-for-zowe.viewMore",
    };
  }
}
