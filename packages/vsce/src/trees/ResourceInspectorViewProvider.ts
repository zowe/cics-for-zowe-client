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

import { WebviewViewProvider, Uri, WebviewView } from "vscode";
import { ResourceInspectorView } from "./ResourceInspectorView";
import { IContainedResource, IResource } from "../doc";

export class ResourceInspectorViewProvider implements WebviewViewProvider {
  public static readonly viewType = "resource-inspector";
  public _manager?: ResourceInspectorView;
  private static instance: ResourceInspectorViewProvider;
  private static refreshed = false;

  constructor(
    private readonly extensionUri: Uri
  ) { }

  public static getInstance(extensionUri: Uri): ResourceInspectorViewProvider {
    if (!this.instance) {
      this.instance = new ResourceInspectorViewProvider(extensionUri);
    }

    return this.instance;
  }

  resolveWebviewView(webviewView: WebviewView) {
    if (this._manager) {
      this._manager.initializeWebview(webviewView);
    }
    ResourceInspectorViewProvider.refreshed = true;
  }

  reloadData(resource: IContainedResource<IResource>, webviewView: WebviewView) {
    this._manager = new ResourceInspectorView(this.extensionUri, resource);
    if (ResourceInspectorViewProvider.refreshed) {
      this.resolveWebviewView(webviewView);
    }
  }
}
