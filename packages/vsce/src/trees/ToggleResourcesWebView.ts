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
import { PersistentStorage } from "../utils/PersistentStorage";
import { getMetas } from "../doc";

export class ToggleResourcesWebView extends WebView {
  persistentStorage: PersistentStorage;

  constructor(context: ExtensionContext) {
    super("Toggle Resources Web view", "toggle-resources", context, {
      onDidReceiveMessage: (message: { command: string; metas?: any[] }) => this.onDidReceiveMessage(message),
      retainContext: true,
    });
    this.persistentStorage = new PersistentStorage("zowe.cics.persistent");
  }

  async onDidReceiveMessage(message: { command: string; resources?: any[] }) {
    if (message.command === "metas") {
      await this.persistentStorage.init();
      const visibles = this.persistentStorage.getVisibleResources();
      await this.panel.webview.postMessage({
        metas: getMetas().map((meta) => {
          return { ...meta, visible: visibles.includes(meta.resourceName) };
        }),
      });
    } else if (message.command === "init") {
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
