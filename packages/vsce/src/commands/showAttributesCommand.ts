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

import { commands, TreeView, WebviewPanel, window } from "vscode";
import { findSelectedNodes } from "../utils/commandUtils";
import { getAttributesHtml } from "../utils/webviewHTML";
import { IResource, ProgramMeta } from "../doc";

export function getShowResourceAttributesCommand(treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showResourceAttributes", async (node) => {
    const nodes = findSelectedNodes(treeview, ProgramMeta, node);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS program selected");
      return;
    }

    for (const resourceNode of nodes) {

      const resource = resourceNode.getContainedResource().resource.attributes;
      const resourceName = resourceNode.getContainedResource().meta.getName(resourceNode.getContainedResource().resource);
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
        `CICS Program ${resourceNode.regionName}(${resourceName})`,
        column || 1,
        { enableScripts: true }
      );
      panel.webview.html = webviewHTML;
    }
  });
}

// export function getShowRegionAttributes(treeview: TreeView<any>) {
//   return commands.registerCommand("cics-extension-for-zowe.showRegionAttributes", async (node) => {
//     const allSelectedNodes = findSelectedNodes(treeview, CICSRegionTree, node);
//     if (!allSelectedNodes || !allSelectedNodes.length) {
//       await window.showErrorMessage("No CICS region selected");
//       return;
//     }
//     for (const regionTree of allSelectedNodes) {
//       const region = regionTree.region;
//       const attributeHeadings = Object.keys(region);
//       let webText = `<thead><tr><th class="headingTH">Attribute <input type="text" id="searchBox" placeholder="Search Attribute..." /></th>`;
//       webText += `<th class="valueHeading">Value</th></tr></thead><tbody>`;
//       for (const heading of attributeHeadings) {
//         webText += `<tr><th class="colHeading">${heading.toUpperCase()}</th><td>${region[heading]}</td></tr>`;
//       }
//       webText += "</tbody>";

//       const webviewHTML = getAttributesHtml(regionTree.getRegionName(), webText);

//       const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;
//       const panel: WebviewPanel = window.createWebviewPanel("zowe", `CICS Region ${regionTree.getRegionName()}`, column || 1, {
//         enableScripts: true,
//       });
//       panel.webview.html = webviewHTML;
//     }
//   });
// }
