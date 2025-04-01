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

import { WebView } from "@zowe/zowe-explorer-api";
import { ExtensionContext } from "vscode";

export class SampleWebview extends WebView {
  constructor(context: ExtensionContext) {
    super("Sample Webview", "sample-app", context, {
      onDidReceiveMessage: (message: { command: string }) => this.onDidReceiveMessage(message),
      retainContext: true,
    });
  }

  async onDidReceiveMessage(message: { command: string; metas?: any[] }) {
    if (message.command === "init") {
      await this.panel.webview.postMessage({
        msg: "Hello from webview class!",
      });
    } else if (message.command === "save") {
      await this.panel.webview.postMessage({
        msg: "Save received by webview class :D",
      });
    }
  }
}
