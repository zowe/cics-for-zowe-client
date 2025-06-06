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
import { commands, WebviewPanel, window } from "vscode";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { runGetResource } from "../utils/resourceUtils";
import { getParametersHtml } from "../utils/webviewHTML";

export function getShowRegionSITParametersCommand() {
  return commands.registerCommand("cics-extension-for-zowe.showRegionParameters", async (node: CICSRegionTree) => {
    const { response } = await runGetResource({
      session: node.parentSession.session,
      resourceName: CicsCmciConstants.CICS_SYSTEM_PARAMETER,
      regionName: `${node.label}`,
      cicsPlex: node.parentPlex ? node.parentPlex.getPlexName() : undefined,
      params: { parameter: "PARMSRCE(COMBINED) PARMTYPE(SIT)" },
    });

    let webText = `<thead><tr><th class="headingTH">CICS Name <input type="text" id="searchBox" placeholder="Search Attribute..." /></th>
        <th class="sourceHeading">Source
          <select id="filterSource" name="cars" id="cars">
            <option value="combined">Combined</option>
            <option value="console">Console</option>
            <option value="jcl">JCL</option>
            <option value="sysin">SYSIN</option>
            <option value="table">Table</option>
          </select>
        </th>
        <th class="valueHeading">Value</th></tr></thead>`;
    webText += "<tbody>";
    for (const systemParameter of response.records.cicssystemparameter) {
      webText += `<tr><th class="colHeading">${systemParameter.keyword.toUpperCase()}</th>`;
      webText += `<td>${systemParameter.source.toUpperCase()}</td><td>${systemParameter.value.toUpperCase()}</td></tr>`;
    }
    webText += "</tbody>";
    const webviewHTML = getParametersHtml(node.getRegionName(), webText);
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
    const panel: WebviewPanel = window.createWebviewPanel("zowe", `CICS Region ${node.getRegionName()}`, column || 1, {
      enableScripts: true,
    });
    panel.webview.html = webviewHTML;
  });
}
