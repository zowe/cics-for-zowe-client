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

import { IResource, IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceMeta } from "../../doc";

// @ts-ignore
const vscode = acquireVsCodeApi();

export interface IResourceInspectorResource {
  name: string;
  context: IResourceContext;
  highlights: { key: string; attribute: string; value: string; }[];
  resource: IResource;
  meta: IResourceMeta<IResource>;
  actions: IResourceInspectorAction[];
}

export interface IResourceInspectorIconPath { light: string; dark: string; }
export interface IResourceInspectorAction { id: string; name: string; }

export interface IResourceInspectorProps {
  command: string;
  resources?: IResourceInspectorResource[];
  resourceIconPath?: IResourceInspectorIconPath;
  actionId?: string;
  humanReadableNamePlural?: string;
  humanReadableNameSingular?: string;
  resourceName?: string;
  resourceContext?: IResourceContext;
}

export function postVscMessage(message: IResourceInspectorProps): void {
  vscode.postMessage(message);
}

export function addVscMessageListener(listener: (ev: MessageEvent<IResourceInspectorProps>) => unknown): void {
  window.addEventListener("message", listener);
}

export function removeVscMessageListener(listener: (ev: MessageEvent<IResourceInspectorProps>) => unknown): void {
  window.removeEventListener("message", listener);
}
