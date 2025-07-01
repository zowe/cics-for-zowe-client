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

import { HTMLTemplate } from "@zowe/zowe-explorer-api";
import { randomUUID } from "crypto";
import { Uri, Webview, WebviewView } from "vscode";
import { IResource } from "../doc";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import Mustache = require("mustache");

export class ResourceInspectorView {
  public _view?: WebviewView;

  constructor(
    private readonly extensionUri: Uri,
    private readonly resource: CICSResourceContainerNode<IResource>
  ) {}

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
    const containedResource = this.resource.getContainedResource();
    if (this._view) {
      await this._view.webview.postMessage({
        command: "init",
        data: {
          name: this.resource.label,
          resourceName: containedResource.meta.resourceName,
          highlights: containedResource.meta.getHighlights(containedResource.resource),
          resource: containedResource.resource.attributes,
          regionName: this.resource.regionName,
          cicsplexName: this.resource.cicsplexName,
          profileName: this.resource.getProfileName(),
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
