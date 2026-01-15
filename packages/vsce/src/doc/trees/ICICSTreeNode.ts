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
import type { TreeItem, TreeItemLabel } from "vscode";
import type { CICSSessionTree } from "../../trees";
import type { TextTreeItem } from "../../trees/TextTreeItem";

export interface ICICSTreeNode extends TreeItem {
  children?: (ICICSTreeNode | TextTreeItem)[];

  refreshIcon(folderOpen: boolean): void;
  getLabel(): string | TreeItemLabel;
  getParent(): ICICSTreeNode;
  getChildren(): Promise<(ICICSTreeNode | TextTreeItem)[]>;
  getProfileName(): string;
  getSessionNode(): ICICSTreeNode | CICSSessionTree;
  getSession(): CICSSession;
  getProfile(): imperative.IProfileLoaded;
  prefetch?(): Promise<void>;
}
