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

import { imperative } from "@zowe/zowe-explorer-api";
import { TreeItem, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { ICICSTreeNode } from "../doc";
import { CICSSession } from "../resources";

export class CICSTreeNode extends TreeItem {
  public children: ICICSTreeNode[] = [];

  constructor(
    label: string | TreeItemLabel,
    collapsibleState: TreeItemCollapsibleState,
    private parent: ICICSTreeNode,
    protected session: CICSSession,
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
    return this.session ?? this.getParent()?.getSession();
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
