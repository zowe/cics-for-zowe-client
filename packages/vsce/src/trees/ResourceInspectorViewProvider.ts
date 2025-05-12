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

import { WebviewViewProvider, Uri, TreeView, WebviewView } from "vscode";
import { ResourceInspectorView } from "./ResourceInspectorView";

export class ResourceInspectorViewProvider implements WebviewViewProvider {
  public static readonly viewType = "resource-inspector";
  public _manager?: ResourceInspectorView;
  private static instance: ResourceInspectorViewProvider;
  private static refreshed = false;

  constructor(
    private readonly extensionUri: Uri,
    private readonly treeview: TreeView<any>
  ) {}

  public static getInstance(extensionUri: Uri, treeview: TreeView<any>): ResourceInspectorViewProvider {
    if (!this.instance) {
      this.instance = new ResourceInspectorViewProvider(extensionUri, treeview);
    }

    return this.instance;
  }

  resolveWebviewView(webviewView: WebviewView) {
    if (this._manager) {
      this._manager.initializeWebview(webviewView);
    }
    ResourceInspectorViewProvider.refreshed = true;
  }

  reloadData(data: { label: string; attributes: any; resource: string; details: any }, webviewView: WebviewView) {
    this._manager = new ResourceInspectorView(this.extensionUri, data);
    if (ResourceInspectorViewProvider.refreshed) {
      this.resolveWebviewView(webviewView);
    }
  }
}
