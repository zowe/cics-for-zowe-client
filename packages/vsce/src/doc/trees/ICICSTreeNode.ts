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
import { TreeItem, TreeItemLabel } from "vscode";
import { CICSSession } from "../../resources/CICSSession";

export interface ICICSTreeNode extends TreeItem {
  children?: ICICSTreeNode[];

  refreshIcon(folderOpen: boolean): void;
  getLabel(): string | TreeItemLabel;
  getParent(): ICICSTreeNode;
  getChildren(): Promise<ICICSTreeNode[]>;
  getProfileName(): string;
  getSessionNode(): ICICSTreeNode;
  getSession(): CICSSession;
  getProfile(): imperative.IProfileLoaded;
  prefetch?(): Promise<void>;
}
