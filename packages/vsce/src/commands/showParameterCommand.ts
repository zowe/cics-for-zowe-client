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

import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { type WebviewPanel, commands, l10n, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import type { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { runGetResource } from "../utils/resourceUtils";
import { getParametersHtml } from "../utils/webviewHTML";

export function getShowRegionSITParametersCommand() {
  return commands.registerCommand(
    "cics-extension-for-zowe.showRegionParameters",
    async (node: CICSRegionTree | CICSResourceContainerNode<IResource>) => {
      // Handle both CICSRegionTree (from tree view) and CICSResourceContainerNode (from Resource Inspector)
      let profileName: string;
      let regionName: string;
      let cicsPlex: string | undefined;

      if (node instanceof CICSRegionTree) {
        // Called from tree view
        profileName = node.getProfile().name;
        regionName = `${node.label}`;
        cicsPlex = node.parentPlex ? node.parentPlex.getPlexName() : undefined;
      } else {
        // Called from Resource Inspector (CICSResourceContainerNode)
        profileName = node.getProfile().name;
        regionName = node.regionName;
        cicsPlex = node.cicsplexName;
      }

      const { response } = await runGetResource({
        profileName,
        resourceName: CicsCmciConstants.CICS_SYSTEM_PARAMETER,
        regionName,
        cicsPlex,
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
      const webviewHTML = getParametersHtml(regionName, webText);
      const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
      const panelTitle = l10n.t("CICS Region {0}", regionName);
      const panel: WebviewPanel = window.createWebviewPanel("zowe", panelTitle, column || 1, {
        enableScripts: true,
      });
      panel.webview.html = webviewHTML;
    }
  );
}
