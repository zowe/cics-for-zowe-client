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

import { IResource, IResourceContext, ResourceAction, ResourceTypeMap, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { HTMLTemplate } from "@zowe/zowe-explorer-api";
import { randomUUID } from "crypto";
import { ExtensionContext, Uri, Webview, WebviewView, WebviewViewProvider, l10n, window } from "vscode";
import { CICSTree } from ".";
import { IContainedResource } from "../doc";
import CICSResourceExtender from "../extending/CICSResourceExtender";
import { Resource, SessionHandler } from "../resources";
import { CICSLogger } from "../utils/CICSLogger";
import IconBuilder from "../utils/IconBuilder";
import { findProfileAndShowJobSpool, toArray } from "../utils/commandUtils";
import { runGetResource } from "../utils/resourceUtils";
import { ExtensionToWebviewMessage, WebviewToExtensionMessage } from "../webviews/common/messages";
import { IResourceInspectorAction, IResourceInspectorResource } from "../webviews/common/vscode";
import { handleActionCommand, handleRefreshCommand } from "./ResourceInspectorUtils";
import Mustache = require("mustache");

export class ResourceInspectorViewProvider implements WebviewViewProvider {
  public static readonly viewType = "resource-inspector";
  private static instance: ResourceInspectorViewProvider;
  public cicsTree: CICSTree;

  private context: ExtensionContext;

  private webviewView?: WebviewView;
  private resources: IResourceInspectorResource[];

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

    this.webviewView.webview.onDidReceiveMessage(async (message: WebviewToExtensionMessage) => {
      switch (message.type) {
        case "init":
          this.webviewReady = true;
          await this.sendResourceDataToWebView();
          break;
        case "refresh":
          await handleRefreshCommand(message.resources, this, this.context);
          break;
        case "executeAction":
          await handleActionCommand(message.actionId, message.resources, this, this.context);
          break;
        case "showLogsForHyperlink":
          await this.handleShowLogsForHyperlink(message.resourceContext);
          break;
      }
    });
    this.webviewView.onDidDispose(() => {
      this.webviewReady = false;
      this.resources = undefined;
    });
  }

  /**
   * Updates the resource to dispaly on the webview.
   * Checks if webview has told us it's ready. If not, data will be sent when it's ready (recieve init command).
   */
  public async setResources(resources: { containedResource: IContainedResource<IResource>; ctx: IResourceContext }[]) {
    const riResources: IResourceInspectorResource[] = [];
    for (const res of resources) {
      const actions = await this.getActionsForResource(res);
      riResources.push({
        resource: res.containedResource.resource.attributes,
        meta: res.containedResource.meta,
        context: res.ctx,
        highlights: res.containedResource.meta.getHighlights(res.containedResource.resource),
        name: res.containedResource.meta.getName(res.containedResource.resource),
        actions,
      });
    }
    this.resources = riResources;

    if (this.webviewReady) {
      await this.sendResourceDataToWebView();
    }
  }

  public getResources(): IResourceInspectorResource[] {
    return this.resources;
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
    const containedResource: IContainedResource<IResource> = {
      resource: new Resource(this.resources[0].resource),
      meta: this.resources[0].meta,
    };

    const message: ExtensionToWebviewMessage = {
      type: "updateResources",
      resources: this.resources,
      resourceIconPath: this.createIconPaths(IconBuilder.resource(containedResource)),
      humanReadableNamePlural: containedResource.meta.humanReadableNamePlural,
      humanReadableNameSingular: containedResource.meta.humanReadableNameSingular,
    };

    await this.webviewView.webview.postMessage(message);
  }

  private async getActionsForResource(r: {
    containedResource: IContainedResource<IResource>;
    ctx: IResourceContext;
  }): Promise<IResourceInspectorAction[]> {
    const asyncFilter = async (
      arr: ResourceAction<keyof ResourceTypeMap>[],
      predicate: (action: ResourceAction<keyof ResourceTypeMap>) => Promise<boolean>
    ) => {
      const results = await Promise.all(arr.map(predicate));
      return arr.filter((_v, index) => results[index]);
    };

    // Gets actions for this resource type
    let actionsForResource = CICSResourceExtender.getActionsFor(ResourceTypes[r.containedResource.meta.resourceName as ResourceTypes]);

    // Filter out resources that shouldn't be visible
    actionsForResource = await asyncFilter(actionsForResource, async (action: ResourceAction<keyof ResourceTypeMap>) => {
      if (!action.visibleWhen) {
        return true;
      }
      if (typeof action.visibleWhen === "boolean") {
        return action.visibleWhen;
      } else {
        const visible = await action.visibleWhen(r.containedResource.resource.attributes as ResourceTypeMap[keyof ResourceTypeMap], r.ctx);
        return visible;
      }
    });

    return actionsForResource.map((ac) => {
      return { id: ac.id, name: ac.name };
    });
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
   * Fetches region data directly using runGetResource and calls showRegionLogs command
   */
  private async handleShowLogsForHyperlink(ctx: IResourceContext) {
    const { regionName, cicsplexName, profile } = ctx;
    try {
      const { response } = await runGetResource({
        profileName: profile.name,
        resourceName: CicsCmciConstants.CICS_CMCI_REGION,
        regionName,
        cicsPlex: cicsplexName,
      });

      if (response.records?.cicsregion) {
        const regionRecords = toArray(response.records.cicsregion);
        if (regionRecords.length > 0) {
          const regionData = regionRecords[0];
          if (regionData && regionData.jobid) {
            const jobid = regionData.jobid;
            const cicsProfile = SessionHandler.getInstance().getProfile(profile.name);
            await findProfileAndShowJobSpool(cicsProfile, jobid, regionName);
          }
        } else {
          CICSLogger.debug(`Empty region records array for ${regionName}`);
          window.showErrorMessage(l10n.t("Could not find region data and job id for region {0} to show logs.", regionName));
        }
      } else {
        CICSLogger.debug(`No region records found for ${regionName}`);
        window.showErrorMessage(l10n.t("Could not find any record for region {0} to show logs.", regionName));
      }
    } catch (error) {
      CICSLogger.error(`Error showing logs for hyperlink. Region: ${regionName}, Error: ${error.message}`);
      window.showErrorMessage(l10n.t("Failed to show logs for region {0}: {1}", regionName, error.message));
    }
  }
}
