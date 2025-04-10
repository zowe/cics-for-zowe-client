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

import { commands, WebviewPanel, window } from "vscode";
import { IResource } from "../doc";
import { CICSRegionTree, CICSResourceContainerNode } from "../trees";
import { getAttributesHtml } from "../utils/webviewHTML";

export function getShowResourceAttributesCommand() {
  return commands.registerCommand("cics-extension-for-zowe.showResourceAttributes", (node: CICSResourceContainerNode<IResource>) => {
    const resource = node.getContainedResource().resource.attributes;
    const resourceName = node.getContainedResource().meta.getName(node.getContainedResource().resource);
    const attributeHeadings = Object.keys(resource);

    let webText = `<thead><tr>`;
    webText += `<th class="headingTH">Attribute <input type="text" id="searchBox" placeholder="Search Attribute..."/></th>`;
    webText += `<th class="valueHeading">Value</th>`;
    webText += `</tr></thead><tbody>`;
    for (const heading of attributeHeadings) {
      webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${resource[heading as keyof IResource]}</td></tr>`;
    }
    webText += "</tbody>";

    const webviewHTML = getAttributesHtml(resourceName, webText);
    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
    const panel: WebviewPanel = window.createWebviewPanel(
      "zowe",
      `${node.getContainedResource().meta.resourceName} ${node.regionName}(${resourceName})`,
      column || 1,
      { enableScripts: true }
    );
    panel.webview.html = webviewHTML;
  });
}

export function getShowRegionAttributes() {
  return commands.registerCommand("cics-extension-for-zowe.showRegionAttributes", (node: CICSRegionTree) => {
    const region = node.region;
    const attributeHeadings = Object.keys(region);
    let webText = `<thead><tr><th class="headingTH">Attribute <input type="text" id="searchBox" placeholder="Search Attribute..." /></th>`;
    webText += `<th class="valueHeading">Value</th></tr></thead><tbody>`;
    for (const heading of attributeHeadings) {
      webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${region[heading]}</td></tr>`;
    }
    webText += "</tbody>";

    const webviewHTML = getAttributesHtml(node.getRegionName(), webText);

    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
    const panel: WebviewPanel = window.createWebviewPanel("zowe", `CICS Region ${node.getRegionName()}`, column || 1, {
      enableScripts: true,
    });
    panel.webview.html = webviewHTML;
  });
}
