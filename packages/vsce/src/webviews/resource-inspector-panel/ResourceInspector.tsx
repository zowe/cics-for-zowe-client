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
      const headerHeight1 = getComputedStyle(headerElement1).height;
      const headerElement2 = document.getElementById("table-header-2");
      headerElement2.style.top = headerHeight1;
    };
    vscode.addScrollerListener(handleScroll);

    vscode.postVscMessage({ command: "init" });

    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);

  return (
    resourceInfo && (
      <div className="maindiv" data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>
        <thead id="table-header-1" className="table-header1">
          <th className="header-cell-1 padding-left-10">
            <div className="div-display-1">{resourceInfo.name}</div>
            <div className="div-display-1 div-display-2">
              {resourceInfo.resourceName}: {resourceInfo.resource.status || resourceInfo.resource.enablestatus}
            </div>
          </th>
        </thead>
        <tbody className="padding-left-10 padding-top-20">
          {resourceInfo.highlights.length > 0 && (
            <tr>
              {resourceInfo.highlights.map((highlight) => (
                <p className="line padding-left-20">
                  {highlight.key}: {highlight.value}
                </p>
              ))}
            </tr>
          )}
        </tbody>

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
