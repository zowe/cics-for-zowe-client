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

import { IResource, IResourceContext, IResourceProfileNameInfo, ResourceAction, ResourceTypeMap, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { HTMLTemplate } from "@zowe/zowe-explorer-api";
import { randomUUID } from "crypto";
import { ExtensionContext, Uri, Webview, WebviewView, WebviewViewProvider, commands } from "vscode";
import { IContainedResource } from "../doc";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { SessionHandler } from "../resources";
import IconBuilder from "../utils/IconBuilder";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { executeAction } from "./ResourceInspectorUtils";
import Mustache = require("mustache");
import { CICSTree } from ".";
import { getJobIdForRegion } from "../commands/showLogsCommand";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSLogger } from "../utils/CICSLogger";

export class ResourceInspectorViewProvider implements WebviewViewProvider {
  public static readonly viewType = "resource-inspector";
  private static instance: ResourceInspectorViewProvider;
  public cicsTree: CICSTree;

  private context: ExtensionContext;
  private node: CICSResourceContainerNode<IResource>;

  private webviewView?: WebviewView;
  private resource: IContainedResource<IResource>;

  private resourceContext: IResourceProfileNameInfo;

  private constructor(
    private readonly extensionUri: Uri,
    private webviewReady: boolean = false
  ) {}

  public static getInstance(context: ExtensionContext, cicsTree?: CICSTree): ResourceInspectorViewProvider {
    if (!this.instance) {
      this.instance = new ResourceInspectorViewProvider(context.extensionUri);
      this.instance.cicsTree = cicsTree;
    }
    this.instance.context = context;
    return this.instance;
  }

  getResourceContext(): IResourceContext {
    const profile = SessionHandler.getInstance().getProfile(this.resourceContext.profileName);

    return {
      profile,
      session: SessionHandler.getInstance().getSession(profile),
      regionName: this.resourceContext.regionName,
      cicsplexName: this.resourceContext.cicsplexName,
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
      localResourceRoots: [this.extensionUri, Uri.joinPath(this.extensionUri, "dist")],
    };
    this.webviewView.webview.html = this._getHtmlForWebview(this.webviewView.webview);

    this.webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "init") {
        this.webviewReady = true;
        await this.sendResourceDataToWebView();
      } else if (message.command === "showLogsForHyperlink") {
        await this.handleShowLogsForHyperlink();
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
   * Sets the current node being used.
   */
  public setNode(node?: CICSResourceContainerNode<IResource>) {
    this.node = node;
    return this;
  }

  /**
   * Returns the current node being used.
   */
  public getNode(): CICSResourceContainerNode<IResource> {
    return this.node;
  }

  public setResourceContext(context: IResourceProfileNameInfo): ResourceInspectorViewProvider {
    this.resourceContext = context;
    return this;
  }

  /**
   * Creates webview-accessible URIs for icon paths
   * @param iconPath The icon path object with light and dark variants
   * @returns An object with webview-accessible URIs for both light and dark themes
   */
  private createIconPaths(iconPath: { light: string; dark: string }) {
    return {
      // Use Uri.file to handle Windows as well as Mac paths correctly
      light: this.webviewView.webview.asWebviewUri(Uri.file(iconPath.light)).toString(),
      dark: this.webviewView.webview.asWebviewUri(Uri.file(iconPath.dark)).toString(),
    };
  }

  /**
   * Posts resource data to the react app which is listening for updates.
   */
  private async sendResourceDataToWebView() {
    await this.webviewView.webview.postMessage({
      data: {
        name: this.resource.meta.getName(this.resource.resource),
        refreshIconPath: this.createIconPaths(IconBuilder.getIconFilePathFromName("refresh")),
        resourceIconPath: this.createIconPaths(IconBuilder.resource(this.resource)),
        humanReadableNameSingular: this.resource.meta.humanReadableNameSingular,
        highlights: this.resource.meta.getHighlights(this.resource.resource),
        resource: this.resource.resource.attributes,
        resourceContext: this.resourceContext,
      },
      actions: (await this.getActions()).map((action) => {
        return {
          id: action.id,
          name: action.name,
        };
      }),
    });
  }

  private async getActions() {
    // Required as Array.filter cannot be asyncronous
    const asyncFilter = async (arr: ResourceAction<keyof ResourceTypeMap>[], predicate: (action: ResourceAction<keyof ResourceTypeMap>) => Promise<boolean>) => {
      const results = await Promise.all(arr.map(predicate));
      return arr.filter((_v, index) => results[index]);
    };

    // Gets actions for this resource type
    let actionsForResource = CICSResourceExtender.getActionsFor(ResourceTypes[this.resource.meta.resourceName as ResourceTypes]);

    // Filter out resources that shouldn't be visible
    actionsForResource = await asyncFilter(actionsForResource, async (action: ResourceAction<keyof ResourceTypeMap>) => {
      if (!action.visibleWhen) {
        return true;
      }
      if (typeof action.visibleWhen === "boolean") {
        return action.visibleWhen;
      } else {
        const visible = await action.visibleWhen(this.resource.resource.attributes as ResourceTypeMap[keyof ResourceTypeMap], this.getResourceContext());
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
    const codiconCssUri = webview.asWebviewUri(Uri.joinPath(this.extensionUri, "dist", "codicon.css"));
    const nonce = randomUUID();

    // Create a custom template that includes the codicon CSS
    const htmlTemplate = HTMLTemplate.default.replace(
      "<head>",
      `<head>
        <link href="${codiconCssUri}" rel="stylesheet" />`
    );

    return Mustache.render(htmlTemplate, {
      uris: {
        resource: {
          script: scriptUri,
        },
      },
      nonce,
    });
  }

  /**
   * Handles the showLogsForHyperlink request from the webview
   * Fetches job ID and calls showRegionLogs command
   */
  private async handleShowLogsForHyperlink() {
    const { regionName, cicsplexName } = this.resourceContext;
    try {
      const regionNode = await this.findRegionNode(regionName, cicsplexName);
      if (regionNode) {
        const jobId = await getJobIdForRegion(regionNode);
        if (jobId) {
          commands.executeCommand("cics-extension-for-zowe.showRegionLogs", regionNode);
        } else {
          CICSLogger.debug(`Could not find Job ID for region ${regionName}`);
        }
      } else {
        CICSLogger.debug(`Region node not found for ${regionName}`);
      }
    } catch (error) {
      CICSLogger.error(`Error showing logs for hyperlink: ${error.message}`);
    }
  }

  /**
   * Finds the CICSRegionTree node for the given region using resourceContext
   */
  private async findRegionNode(regionName: string, cicsplexName?: string): Promise<CICSRegionTree | undefined> {
    if (!this.cicsTree) {
      CICSLogger.debug('No CICS tree available');
      return undefined;
    }
    // Navigate tree using resourceContext: profileName -> cicsplexName -> regionName
    const sessionNodes = await this.cicsTree.getChildren();
    const profileNode = sessionNodes?.find(
      (sessionNode) => sessionNode.getProfile().name === this.resourceContext.profileName
    );
    if (!profileNode) {
      CICSLogger.debug(`Profile node not found for: ${this.resourceContext.profileName}`);
      return undefined;
    }
    const regionNode = profileNode.getRegionNodeFromName(regionName, cicsplexName);
    if (!regionNode) {
      CICSLogger.debug(`Region node not found for: ${regionName}`);
      return undefined;
    }
    return regionNode;
  }
}
