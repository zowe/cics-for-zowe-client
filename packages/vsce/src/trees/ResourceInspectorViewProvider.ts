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

import { IResourceAction, IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { HTMLTemplate } from "@zowe/zowe-explorer-api";
import { randomUUID } from "crypto";
import { ExtensionContext, Uri, Webview, WebviewView, WebviewViewProvider, commands } from "vscode";
import { IContainedResource, IResource } from "../doc";
import { IResourcesHandler } from "../doc/resources/IResourcesHandler";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import Mustache = require("mustache");
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { executeAction } from "./ResourceInspectorUtils";
import IconBuilder from "../utils/IconBuilder";

export class ResourceInspectorViewProvider implements WebviewViewProvider {
  public static readonly viewType = "resource-inspector";
  private static instance: ResourceInspectorViewProvider;
  private context: ExtensionContext;

  private webviewView?: WebviewView;
  private resource: IContainedResource<IResource>;

  private resourceHandlerMap: { key: string; value: string; }[];
  private node: CICSResourceContainerNode<IResource>;

  private constructor(
    private readonly extensionUri: Uri,
    private webviewReady: boolean = false,
  ) { }

  public static getInstance(context: ExtensionContext): ResourceInspectorViewProvider {
    if (!this.instance) {
      this.instance = new ResourceInspectorViewProvider(context.extensionUri);
    }
    this.instance.context = context;
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
      } else {
        executeAction(message.command, message, this, this.context);
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

  public async getResource(): Promise<IContainedResource<IResource>> {
    return this.resource;
  }

  public setResourceHandlerMap(resourceHandler: IResourcesHandler): ResourceInspectorViewProvider {
    this.resourceHandlerMap = [];
    this.resourceHandlerMap.push({ key: "profile", value: resourceHandler.resourceContainer.getProfileName() });
    const cicsplex = resourceHandler.resourceContainer.getPlexName();
    const plexvalue = cicsplex === undefined ? null : cicsplex;
    this.resourceHandlerMap.push({
      key: "cicsplex",
      value: plexvalue,
    });
    const cicsregion = resourceHandler.resourceContainer.getRegionName();
    const regionValue = cicsregion === undefined ? null : cicsregion;
    this.resourceHandlerMap.push({ key: "region", value: regionValue });

    return this;
  }

  public async getResourceHandlerMap(): Promise<{ key: string; value: string }[]> {
    return this.resourceHandlerMap;
  }

  public setNode(node: CICSResourceContainerNode<IResource>) {
    this.node = node;
    return this;
  }

  public getNode(): CICSResourceContainerNode<IResource> {
    return this.node;
  }

  /**
   * Posts resource data to the react app which is listening for updates.
   */
  private async sendResourceDataToWebView() {
    await this.webviewView.webview.postMessage({
      data: {
        name: this.resource.meta.getName(this.resource.resource),
        refreshIconPath: {
          light: this.webviewView.webview.asWebviewUri(Uri.parse(IconBuilder.getIconFilePathFromName("refresh").light)).toString(),
          dark: this.webviewView.webview.asWebviewUri(Uri.parse(IconBuilder.getIconFilePathFromName("refresh").dark)).toString(),
        },
        resourceName: this.resource.meta.resourceName,
        highlights: this.resource.meta.getHighlights(this.resource.resource),
        resource: this.resource.resource.attributes,
        profileHandler: this.resourceHandlerMap,
      },
      actions: (await this.getActions()).map((action) => {
        return {
          id: action.id,
          name: action.name,
          iconPath: {
            light: this.webviewView.webview.asWebviewUri(Uri.parse(action.iconPath?.light)),
            dark: this.webviewView.webview.asWebviewUri(Uri.parse(action.iconPath?.dark)),
          },
        };
      })
    });
  }

  private async getActions() {
    // Required as Array.filter cannot be asyncronous
    const asyncFilter = async (arr: IResourceAction[], predicate: (action: IResourceAction) => Promise<boolean>) => {
      const results = await Promise.all(arr.map(predicate));
      return arr.filter((_v, index) => results[index]);
    };

    // Gets actions for this resource type
    let actionsForResource = CICSResourceExtender.getActionsForResourceType([this.resource.meta.resourceName]);

    // Filter out resources that shouldn't be visible
    actionsForResource = await asyncFilter(actionsForResource, async (action: IResourceAction) => {
      if (!action.visibleWhen) {
        return true;
      }
      if (typeof action.visibleWhen === 'boolean') {
        return action.visibleWhen;
      } else {
        const visible = await action.visibleWhen(this.resource.resource.attributes, {} as IResourceContext);
        return visible;
      }
    });

    return actionsForResource;
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
