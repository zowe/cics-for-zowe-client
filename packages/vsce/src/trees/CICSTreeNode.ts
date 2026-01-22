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

import type { CICSSession } from "@zowe/cics-for-zowe-sdk";
import type { imperative } from "@zowe/zowe-explorer-api";
import { TreeItem, type TreeItemCollapsibleState, type TreeItemLabel } from "vscode";
import type { ICICSTreeNode } from "../doc";
import { SessionHandler } from "../resources";
import type { TextTreeItem } from "./TextTreeItem";

export class CICSTreeNode extends TreeItem {
  public children: (ICICSTreeNode | TextTreeItem)[] = [];

  constructor(
    label: string | TreeItemLabel,
    collapsibleState: TreeItemCollapsibleState,
    private parent: ICICSTreeNode,
    protected profile: imperative.IProfileLoaded
  ) {
    super(label, collapsibleState);
    if (!profile && parent && parent.getProfile()) {
      this.profile = parent.getProfile();
    }
  }

  public getParent(): ICICSTreeNode {
    return this.parent;
  }

  public getSession(): CICSSession {
    return SessionHandler.getInstance().getSession(this.profile);
  }

  public getProfile(): imperative.IProfileLoaded {
    return this.profile ?? this.getParent()?.getProfile();
  }

  public getProfileName(): string {
    return this.getProfile()?.name;
  }

  public getLabel(): string | TreeItemLabel {
    return this.label;
  }
}
