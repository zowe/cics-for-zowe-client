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

import { commands, extensions, l10n, window, workspace } from "vscode";

export async function openConfigFile(filePath: string): Promise<void> {
  const document = await workspace.openTextDocument(filePath);
  await window.showTextDocument(document);
}

export function getZoweExplorerVersion(): string | undefined {
  const extension = extensions.getExtension("zowe.vscode-extension-for-zowe");
  return extension?.packageJSON?.version;
}

export function openSettingsForHiddenResourceType(msg: string, resourceType: string): boolean {
  const config = workspace.getConfiguration("zowe.cics.resources");
  const openSettings = l10n.t("Open Settings");
  const cancel = l10n.t("Cancel");

  if (!config.get<boolean>(resourceType)) {
    window.showInformationMessage(msg, openSettings, cancel).then(async (select) => {
      if (select === openSettings) {
        await commands.executeCommand("workbench.action.openSettings", "zowe.cics.resources");
      }
    });
    return false;
  }
  return true;
}
