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
import { ExtensionContext, commands } from "vscode";
import { PersistentStorage } from "../utils/PersistentStorage";

export class ResourceInspectorView extends WebView {
  persistentStorage: PersistentStorage;

  constructor(context: ExtensionContext, program: any) {
    super("Resource Inspector view", "resource-inspector", context, {
      onDidReceiveMessage: (message: { command: string; metas?: any[] }) => this.onDidReceiveMessage(message, program),
      retainContext: true,
    });
    this.setTableView();
  }

  public async setTableView(): Promise<void> {
    await commands.executeCommand("setContext", "zowe.vscode-extension-for-zowe.showResourceInspector", true);
    await commands.executeCommand("workbench.view.extension.inspector-panel");
  }

  async onDidReceiveMessage(message: { command: string; resources?: any[] }, program: any) {
    if (message.command === "init") {
      console.log("printing program.label", program.label);
      console.log("printing program.program", program.program);
      await this.panel.webview.postMessage({
        label: program.label,
        attribute: program.program,
      });
    }
  }
}
