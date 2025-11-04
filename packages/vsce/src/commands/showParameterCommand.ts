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

import { WebviewPanel, commands, l10n, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { getAttributesHtml } from "../utils/webviewHTML";

const CICS_NAME_LABEL = l10n.t("CICS Name");
const SEARCH_PLACEHOLDER = l10n.t("Search Attribute...");
const SOURCE_LABEL = l10n.t("Source");
const OPTION_COMBINED = l10n.t("Combined");
const OPTION_CONSOLE = l10n.t("Console");
const OPTION_JCL = l10n.t("JCL");
const OPTION_SYSIN = l10n.t("SYSIN");
const OPTION_TABLE = l10n.t("Table");
const VALUE_LABEL = l10n.t("Value");
const REGION_PANEL_TITLE = (region: string) => l10n.t("CICS Region {0}", region);

export function getShowRegionSITParametersCommand() {
  return commands.registerCommand("cics-extension-for-zowe.showRegionSITParameters", (node: CICSRegionTree) => {
    const region = node?.region as any;
    // region.sitParameters expected shape: Array<{ name: string, source?: string, value?: string }>
    const params: Array<{ name: string; source?: string; value?: string }> = region?.sitParameters ?? [];

    let webText = `<thead><tr><th class="headingTH">${CICS_NAME_LABEL} <input type="text" id="searchBox" placeholder="${SEARCH_PLACEHOLDER}" /></th>`;
    webText += `<th class="sourceHeading">${SOURCE_LABEL}
      <select id="filterSource" name="filterSource">
        <option value="combined">${OPTION_COMBINED}</option>
        <option value="console">${OPTION_CONSOLE}</option>
        <option value="jcl">${OPTION_JCL}</option>
        <option value="sysin">${OPTION_SYSIN}</option>
        <option value="table">${OPTION_TABLE}</option>
      </select>
    </th>`;
    webText += `<th class="valueHeading">${VALUE_LABEL}</th></tr></thead><tbody>`;

    for (const p of params) {
      const name = (p.name ?? "").toUpperCase();
      const src = p.source ?? "";
      const val = p.value ?? "";
      webText += `<tr><th class="colHeading">${name}</th><td class="srcCell">${src}</td><td class="valCell">${val}</td></tr>`;
    }

    webText += "</tbody>";

    const webviewHTML = getAttributesHtml(node.getRegionName(), webText);
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
    const panel: WebviewPanel = window.createWebviewPanel("zowe", REGION_PANEL_TITLE(node.getRegionName()), column || 1, {
      enableScripts: true,
    });
    panel.webview.html = webviewHTML;
  });
}
