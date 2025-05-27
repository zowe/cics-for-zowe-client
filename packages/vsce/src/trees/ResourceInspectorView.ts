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

import { WebviewView, Uri, Webview } from "vscode";
import Mustache = require("mustache");
import { HTMLTemplate } from "@zowe/zowe-explorer-api";
import { randomUUID } from "crypto";
import { IContainedResource, IResource } from "../doc";

export class ResourceInspectorView {
  public _view?: WebviewView;

  constructor(
    private readonly extensionUri: Uri,
    private readonly resource: IContainedResource<IResource>,
  ) { }

  initializeWebview(webviewView: WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "init") {
        await this.sendDataToReactApp();
      }
    });
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private async sendDataToReactApp() {
    if (this._view) {
      await this._view.webview.postMessage({
        command: "init",
        data: {
          name: this.resource.meta.getName(this.resource.resource),
          highlights: this.resource.meta.getHighlights(this.resource.resource),
          resource: this.resource.resource.attributes,
        },
      });
    }
  }

  private _getHtmlForWebview(webview: Webview): string {
    const scriptUri = webview.asWebviewUri(Uri.joinPath(this.extensionUri, "dist", "resourceInspectorPanelView.js"));
    const nonce = randomUUID();

    return Mustache.render(HTMLTemplate.default, {
      uris: { resource: { script: scriptUri } },
      nonce,
    });
  }
}
