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

import { WebView } from '@zowe/zowe-explorer-api';
import { getMetas } from '../doc';
import { PersistentStorage } from '../utils/PersistentStorage';
import { commands, ExtensionContext } from 'vscode';

export class ToggleResourceTreeWebView extends WebView {

  persistentStorage: PersistentStorage;

  constructor(context: ExtensionContext) {
    super('Toggle Resources', "toggle-resources", context, {
      onDidReceiveMessage: (message: { command: string; metas?: any[]; }) => this.onDidReceiveMessage(message),
      retainContext: true,
    });
    this.persistentStorage = new PersistentStorage("zowe.cics.persistent");
  }

  async onDidReceiveMessage(message: { command: string; metas?: any[]; }) {
    if (message.command === "metas") {
      await this.persistentStorage.init();
      const visibles = this.persistentStorage.getVisibleResources();

      await this.panel.webview.postMessage({
        metas: getMetas().map((meta) => { return { ...meta, visible: visibles.includes(meta.resourceName) }; })
      });
    } else if (message.command === "save") {
      const visibleResources = message.metas.filter((meta) => meta.visible).map((meta) => meta.resourceName);
      await this.persistentStorage.setVisibleResources(visibleResources);
      this.panel.dispose();
      commands.executeCommand("cics-extension-for-zowe.refreshTree");
    }
  }
}
