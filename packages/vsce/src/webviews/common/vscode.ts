/*******************************************************************************
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corporation 2023, 2025. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 *******************************************************************************/

// @ts-ignore
const vscode = acquireVsCodeApi();

export interface TransformWebviewMessage {
  command: string;
  data?: any;
  payload?: unknown;
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

export function removeVscMessageListener(
  listener: (
    ev:
      | MessageEvent<TransformWebviewMessage>
  ) => unknown
): void {
  window.removeEventListener('message', listener);
}
