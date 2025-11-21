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

export function getShowResourceAttributesCommand(treeview: TreeView<CICSResourceContainerNode<IResource>>) {
  return commands.registerCommand("cics-extension-for-zowe.showResourceAttributes", (node: CICSResourceContainerNode<IResource>) => {
    for (const res of [...new Set([...treeview.selection, node])].filter(
      (item) => item instanceof CICSResourceContainerNode && item.getContainedResource()?.resource
    )) {
      const resource = res.getContainedResource().resource.attributes;
      const resourceName = res.getContainedResourceName();
      const attributeHeadings = Object.keys(resource);

      const headingAttr = l10n.t("Attribute");
      const placeholderSearch = l10n.t("Search Attribute...");
      const headingValue = l10n.t("Value");

      let webText = `<thead><tr>`;
      webText += `<th class="headingTH">${headingAttr} <input type="text" id="searchBox" placeholder="${placeholderSearch}"/></th>`;
      webText += `<th class="valueHeading">${headingValue}</th>`;
      webText += `</tr></thead><tbody>`;
      for (const heading of attributeHeadings) {
        webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${resource[heading as keyof IResource]}</td></tr>`;
      }
      webText += "</tbody>";

      const webviewHTML = getAttributesHtml(resourceName, webText);
      const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
      const panelTitle = l10n.t("{0} {1}({2})", res.getContainedResource().meta.resourceName, res.regionName, resourceName);
      const panel: WebviewPanel = window.createWebviewPanel("zowe", panelTitle, column || 1, { enableScripts: true });
      panel.webview.html = webviewHTML;
    }
  });
}

export function getShowRegionAttributes() {
  return commands.registerCommand("cics-extension-for-zowe.showRegionAttributes", (node: CICSRegionTree) => {
    const region = node.region;
    const attributeHeadings = Object.keys(region);
    const headingAttr = l10n.t("Attribute");
    const placeholderSearch = l10n.t("Search Attribute...");
    const headingValue = l10n.t("Value");
    let webText = `<thead><tr><th class="headingTH">${headingAttr} <input type="text" id="searchBox" placeholder="${placeholderSearch}" /></th>`;
    webText += `<th class="valueHeading">${headingValue}</th></tr></thead><tbody>`;
    for (const heading of attributeHeadings) {
      webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${region[heading]}</td></tr>`;
    }
    webText += "</tbody>";

    const webviewHTML = getAttributesHtml(node.getRegionName(), webText);

    const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
    const panelTitle = l10n.t("CICS Region {0}", node.getRegionName());
    const panel: WebviewPanel = window.createWebviewPanel("zowe", panelTitle, column || 1, { enableScripts: true });
    panel.webview.html = webviewHTML;
  });
}
