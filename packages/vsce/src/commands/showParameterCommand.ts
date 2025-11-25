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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { WebviewPanel, commands, l10n, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { runGetResource } from "../utils/resourceUtils";
import { getParametersHtml } from "../utils/webviewHTML";

export function getShowRegionSITParametersCommand() {
  return commands.registerCommand("cics-extension-for-zowe.showRegionParameters", async (node: CICSRegionTree) => {
    const { response } = await runGetResource({
      profileName: node.getProfile().name,
      resourceName: CicsCmciConstants.CICS_SYSTEM_PARAMETER,
      regionName: `${node.label}`,
      cicsPlex: node.parentPlex ? node.parentPlex.getPlexName() : undefined,
      params: { parameter: "PARMSRCE(COMBINED) PARMTYPE(SIT)" },
    });

    const headingCicsName = l10n.t("CICS Name");
    const placeholderSearch = l10n.t("Search Attribute...");
    const headingSource = l10n.t("Source");
    const optCombined = l10n.t("Combined");
    const optConsole = l10n.t("Console");
    const optJcl = l10n.t("JCL");
    const optSysin = l10n.t("SYSIN");
    const optTable = l10n.t("Table");
    const headingValue = l10n.t("Value");

    let webText = `<thead><tr><th class="headingTH">${headingCicsName} <input type="text" id="searchBox" placeholder="${placeholderSearch}" /></th>
        <th class="sourceHeading">${headingSource}
          <select id="filterSource" name="filterSource">
            <option value="combined">${optCombined}</option>
            <option value="console">${optConsole}</option>
            <option value="jcl">${optJcl}</option>
            <option value="sysin">${optSysin}</option>
            <option value="table">${optTable}</option>
          </select>
        </th>
        <th class="valueHeading">${headingValue}</th></tr></thead>`;
    webText += "<tbody>";
    for (const systemParameter of response.records.cicssystemparameter) {
      webText += `<tr><th class="colHeading">${systemParameter.keyword.toUpperCase()}</th>`;
      webText += `<td>${systemParameter.source.toUpperCase()}</td><td>${systemParameter.value.toUpperCase()}</td></tr>`;
    }
    webText += "</tbody>";
    const webviewHTML = getParametersHtml(node.getRegionName(), webText);
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
    const panelTitle = l10n.t("CICS Region {0}", node.getRegionName());
    const panel: WebviewPanel = window.createWebviewPanel("zowe", panelTitle, column || 1, {
      enableScripts: true,
    });
    panel.webview.html = webviewHTML;
  });
}
