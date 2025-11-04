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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { TreeView, WebviewPanel, commands, l10n, window } from "vscode";
import { CICSRegionTree, CICSResourceContainerNode } from "../trees";
import { getAttributesHtml } from "../utils/webviewHTML";

const ATTRIBUTE_LABEL = l10n.t("Attribute");
const VALUE_LABEL = l10n.t("Value");
const SEARCH_PLACEHOLDER = l10n.t("Search Attribute...");
const REGION_PANEL_TITLE = (region: string) => l10n.t("CICS Region {0}", region);
const RESOURCE_PANEL_TITLE = (title: string, region: string, name: string) => l10n.t("{0} {1} ({2})", title, region, name);

export function getShowResourceAttributesCommand(treeview: TreeView<CICSResourceContainerNode<IResource>>) {
  return commands.registerCommand("cics-extension-for-zowe.showResourceAttributes", (node: CICSResourceContainerNode<IResource>) => {
    for (const res of [...new Set([...treeview.selection, node])].filter(
      (item) => item instanceof CICSResourceContainerNode && item.getContainedResource()?.resource
    )) {
      const resource = res.getContainedResource().resource.attributes;
      const resourceName = res.getContainedResourceName();
      const attributeHeadings = Object.keys(resource);

      let webText = `<thead><tr>`;
      webText += `<th class="headingTH">${ATTRIBUTE_LABEL} <input type="text" id="searchBox" placeholder="${SEARCH_PLACEHOLDER}"/></th>`;
      webText += `<th class="valueHeading">${VALUE_LABEL}</th>`;
      webText += `</tr></thead><tbody>`;
      for (const heading of attributeHeadings) {
        webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${resource[heading as keyof IResource]}</td></tr>`;
      }
      webText += "</tbody>";

      const webviewHTML = getAttributesHtml(resourceName, webText);
      const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
      const panelTitle = RESOURCE_PANEL_TITLE(res.getContainedResource().meta.resourceName, res.regionName, resourceName);
      const panel: WebviewPanel = window.createWebviewPanel("zowe", panelTitle, column || 1, { enableScripts: true });
      panel.webview.html = webviewHTML;
    }
  });
}

export function getShowRegionAttributes() {
  return commands.registerCommand("cics-extension-for-zowe.showRegionAttributes", (node: CICSRegionTree) => {
    const region = node.region;
    const attributeHeadings = Object.keys(region);
    let webText = `<thead><tr><th class="headingTH">${ATTRIBUTE_LABEL} <input type="text" id="searchBox" placeholder="${SEARCH_PLACEHOLDER}" /></th>`;
    webText += `<th class="valueHeading">${VALUE_LABEL}</th></tr></thead><tbody>`;
    for (const heading of attributeHeadings) {
      webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${region[heading]}</td></tr>`;
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
