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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";

// @ts-ignore
const vscode = acquireVsCodeApi();

export interface TransformWebviewMessage {
  command: string;
  data?: {
    name: string;
    refreshIconPath: { light: string; dark: string };
    iconsMapping?: { [key: string]: { light: string; dark: string } };
    resourceName: string;
    humanReadableNameSingular: string;
    highlights: { key: string; value: string; }[];
    resource: IResource;
    profileHandler: { key: string; value: string; }[];
  };
  actions?: {
    id: string;
    name: string;
  }[];
  actionId?: string;
}

export function postVscMessage(
  message: TransformWebviewMessage
): void {
  vscode.postMessage({ ...message });
}

export function addVscMessageListener(
  listener: (
    ev:
      | MessageEvent<TransformWebviewMessage>
  ) => unknown
): void {
  window.addEventListener('message', listener);
}

export function addScrollerListener(listener: (ev: MessageEvent<TransformWebviewMessage>) => unknown): void {
  window.addEventListener("scroll", listener);
}

export function addResizeListener(listener: (ev: MessageEvent<TransformWebviewMessage>) => unknown): void {
  window.addEventListener("resize", listener);
}

export function removeVscMessageListener(
  listener: (
    ev:
      | MessageEvent<TransformWebviewMessage>
  ) => unknown
): void {
  window.removeEventListener('message', listener);
}
