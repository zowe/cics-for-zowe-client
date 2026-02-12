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

import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceInspectorIconPath, IResourceInspectorResource } from "./vscode";

/**
 * Messages sent FROM webview TO extension
 */
export type WebviewToExtensionMessage =
  | { type: "init"; }
  | { type: "refresh"; resources: IResourceInspectorResource[]; }
  | { type: "executeAction"; actionId: string; resources: IResourceInspectorResource[]; }
  | { type: "showLogsForHyperlink"; resourceContext: IResourceContext; };

/**
 * Messages sent FROM extension TO webview
 */
export type ExtensionToWebviewMessage = {
  type: "updateResources";
  resources: IResourceInspectorResource[];
  resourceIconPath: IResourceInspectorIconPath;
  humanReadableNamePlural: string;
  humanReadableNameSingular: string;
};
