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
import Mustache = require("mustache");
import { WebviewViewProvider, Uri, WebviewView, Webview } from "vscode";
import { IContainedResource, IResource } from "../doc";
import { IResourcesHandler } from "../doc/resources/IResourcesHandler";

export class ResourceInspectorViewProvider implements WebviewViewProvider {

  public static readonly viewType = "resource-inspector";
  private static instance: ResourceInspectorViewProvider;

  private webviewView?: WebviewView;
  private resource: IContainedResource<IResource>;

  private resourceHandlerMap: { key: string; value: string }[];

  private constructor(
    private readonly extensionUri: Uri,
    private webviewReady: boolean = false,
  ) { }

  public static getInstance(extensionUri: Uri): ResourceInspectorViewProvider {
    if (!this.instance) {
      this.instance = new ResourceInspectorViewProvider(extensionUri);
    }

    return this.instance;
  }

  /**
   * Method called by VS Code when a view first becomes visible.
   * Captures and stores the webview instance we get back to reuse for it's life.
   * 1 event listener, 1 view, refreshable content.
   */
  public resolveWebviewView(webviewView: WebviewView) {
    this.webviewView = webviewView;
    this.webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };
    this.webviewView.webview.html = this._getHtmlForWebview(this.webviewView.webview);

    this.webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "init") {
        this.webviewReady = true;
        await this.sendResourceDataToWebView();
      }
    });
    this.webviewView.onDidDispose(() => {
      this.webviewReady = false;
      this.resource = undefined;
    });
  }

  /**
   * Updates the resource to dispaly on the webview.
   * Checks if webview has told us it's ready. If not, data will be sent when it's ready (recieve init command).
   */
  public async setResource(resource: IContainedResource<IResource>) {
    this.resource = resource;

    if (this.webviewReady) {
      await this.sendResourceDataToWebView();
    }
  }

  public setResourceHandlerMap(resourceHandler: IResourcesHandler): ResourceInspectorViewProvider {
    this.resourceHandlerMap = [];
    this.resourceHandlerMap.push({ key: "profile", value: resourceHandler.resourceContainer.getProfileName().toUpperCase() });
    const cicsplex = resourceHandler.resourceContainer.getPlexName();
    const plexvalue = cicsplex === undefined ? null : cicsplex.toUpperCase();
    this.resourceHandlerMap.push({
      key: "cicsplex",
      value: plexvalue,
    });
    this.resourceHandlerMap.push({ key: "region", value: resourceHandler.resourceContainer.getRegionName().toUpperCase() });

    return this;
  }

  /**
   * Posts resource data to the react app which is listening for updates.
   */
  private async sendResourceDataToWebView() {
    await this.webviewView.webview.postMessage({
      data: {
        name: this.resource.meta.getName(this.resource.resource),
        resourceName: this.resource.meta.resourceName,
        highlights: this.resource.meta.getHighlights(this.resource.resource),
        resource: this.resource.resource.attributes,
        profileHandler: this.resourceHandlerMap,
      },
    });
  }

  /**
   * Builds the HTML for the webview using the built react app.
   */
  private _getHtmlForWebview(webview: Webview): string {
    const scriptUri = webview.asWebviewUri(Uri.joinPath(this.extensionUri, "dist", "resourceInspectorPanelView.js"));
    const nonce = randomUUID();

    return Mustache.render(HTMLTemplate.default, {
      uris: { resource: { script: scriptUri } },
      nonce,
    });
  }
}
