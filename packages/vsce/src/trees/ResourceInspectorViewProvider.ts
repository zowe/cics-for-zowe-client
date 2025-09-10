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
import { ExtensionContext, WebviewViewProvider, Uri, WebviewView, Webview } from "vscode";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { IContainedResource, IResource } from "../doc";
import { IResourcesHandler } from "../doc/resources/IResourcesHandler";
import { IResourceAction, IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { SessionHandler } from "../resources";
import { ProfileManagement } from "../utils/profileManagement";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { executeAction } from "./ResourceInspectorUtils";
import IconBuilder from "../utils/IconBuilder";

export class ResourceInspectorViewProvider implements WebviewViewProvider {

  public static readonly viewType = "resource-inspector";
  private static instance: ResourceInspectorViewProvider;

  private context: ExtensionContext;
  private node: CICSResourceContainerNode<IResource>;

  private webviewView?: WebviewView;
  private resource: IContainedResource<IResource>;

  private resourceHandlerMap: { key: string; value: string; }[];

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

  private getResourceContext(): IResourceContext {
    const profileName = this.resourceHandlerMap.filter((itm) => itm.key === "profile")[0].value;
    const profile = ProfileManagement.getProfilesCache().loadNamedProfile(profileName, "cics");

    const session = SessionHandler.getInstance().getSession(profile);
    const cicsplexName = this.resourceHandlerMap.filter((itm) => itm.key === "cicsplex")[0].value;
    const regionName = this.resourceHandlerMap.filter((itm) => itm.key === "region")[0].value;

    return {
      profile,
      session,
      cicsplexName,
      regionName,
    };
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

  /**
   * Returns the current resource being displayed.
   */
  public getResource(): IContainedResource<IResource> {
    return this.resource;
  }

  /**
   * Returns the current resource handler map being used.
   */
  public getResourceHandlerMap(): { key: string; value: string }[] {
    return this.resourceHandlerMap;
  }

  /**
   * Sets the current node being used.
   */
  public setNode(node: CICSResourceContainerNode<IResource>) {
    this.node = node;
    return this;
  }

  /**
   * Returns the current node being used.
   */
  public getNode(): CICSResourceContainerNode<IResource> {
    return this.node;
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
        humanReadableNameSingular: this.resource.meta.humanReadableNameSingular,
        highlights: this.resource.meta.getHighlights(this.resource.resource),
        resource: this.resource.resource.attributes,
        profileHandler: this.resourceHandlerMap,
      },
      actions: (await this.getActions()).map((action) => {
        return {
          id: action.id,
          name: action.name,
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
        const visible = await action.visibleWhen(this.resource.resource.attributes, this.getResourceContext());
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
