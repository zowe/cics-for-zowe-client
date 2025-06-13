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

import { VscodeTextfield } from "@vscode-elements/react-elements";

import * as React from "react";
import * as vscode from "../common/vscode";

import { IResource } from "../../doc";
import "../css/style.css";

const ResourceInspector = () => {
  const [search, setSearch] = React.useState("");

  const [resourceInfo, setResourceInfo] = React.useState<{
    name: string;
    resourceName: string;
    highlights: { key: string; value: string }[];
    resource: IResource;
  }>();

  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      setResourceInfo(event.data.data);
    };
    vscode.addVscMessageListener(listener);
    const handleScroll = () => {
      const headerElement1 = document.getElementById("table-header-1");
      const headerHeight1 = headerElement1.offsetHeight;
      const headerElement2 = document.getElementById("table-header-2");
      // Adjust the top position of the second header based on the first header's height
      headerElement2.style.top = headerHeight1 - 1 + "px";
    };
    vscode.addScrollerListener(handleScroll);

    const handleResize = () => {
      const headerElement1 = document.getElementById("table-header-1");
      const headerElement2 = document.getElementById("table-header-2");
      // Adjust the width of both table headers on resize with a offset margin to maintain header alingment
      if (headerElement1.style.width != getComputedStyle(headerElement2).width) {
        headerElement1.style.width = Number(getComputedStyle(headerElement2).width.replace("px", "")) - 10 + "px";
      }
    };
    vscode.addResizeListener(handleResize);

    vscode.postVscMessage({ command: "init" });

    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);

  return (
    resourceInfo && (
      <div className="maindiv" data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>
        <table id="table-1" className="border-collapse">
          <thead id="table-header-1" className="table-header1">
            <th id="th-1" className="header-cell-1 padding-left-10">
              <div className="div-display-1">{resourceInfo.name}</div>
              <div className="div-display-1 div-display-2">
                {resourceInfo.resourceName}: {resourceInfo.resource.status || resourceInfo.resource.enablestatus}
              </div>
            </th>
          </thead>
          <tbody className="padding-left-10 padding-top-20">
            {resourceInfo.highlights.length > 0 && (
              <tr>
                <p className="padding-top-10"></p>
                {resourceInfo.highlights.map((highlight) => (
                  <p className="line padding-left-20">
                    {highlight.key}: {highlight.value}
                  </p>
                ))}
              </tr>
            )}
          </tbody>
        </table>

        <table className="border-collapse">
          <thead id="table-header-2" className="thead-2 vertical-align-sub">
            <th className="div-display-1 th-2">Attribute</th>
            <th className="padding-right-10 th-3">
              <div>
                <div className="div-display-1 vertical-align-sub">Value</div>
                <VscodeTextfield
                  type="text"
                  placeholder="Keyword search..."
                  onInput={(e: { target: HTMLInputElement }) => setSearch(e.target.value)}
                  value={search}
                  className="search-style div-display-1"
                ></VscodeTextfield>
              </div>
            </th>
          </thead>
          <tbody>
            {Object.entries(resourceInfo.resource)
              .filter(([key, value]) => !key.startsWith("_"))
              .filter(
                ([key, value]) =>
                  key.toLowerCase().trim().includes(search.toLowerCase().trim()) || value.toLowerCase().trim().includes(search.toLowerCase().trim())
              )
              .map(([key, value]) => (
                <tr>
                  <td className="padding-left-27 width-30">{key}</td>
                  <td className="padding-right-75 width-70">{value}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    )
  );
};

export default ResourceInspector;
