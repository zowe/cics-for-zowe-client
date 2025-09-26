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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import "../css/style.css";
import Breadcrumb from "./Breadcrumb";
import Contextmenu from "./Contextmenu";

const ResourceInspector = () => {
  const [search, setSearch] = React.useState("");

  const [resourceInfo, setResourceInfo] = React.useState<{
    name: string;
    refreshIconPath: { light: string; dark: string };
    iconsMapping?: { [key: string]: { light: string; dark: string } };
    humanReadableNameSingular: string;
    highlights: { key: string; value: string; }[];
    resource: IResource;
    profileHandler: { key: string; value: string; }[];
  }>();
  const [resourceActions, setResourceActions] = React.useState<{
      id: string;
      name: string;
  }[]>([]);

  const handleActionClick = (actionId: string) => {
    vscode.postVscMessage({ command: "action", actionId });
  };

  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      setResourceInfo(event.data.data);
      setResourceActions(event.data.actions);
    };
    vscode.addVscMessageListener(listener);

    const handleResize = () => {
      const headerElement1 = document.getElementById("table-header-1");
      const headerElement2 = document.getElementById("table-header-2");

      if (headerElement1 && headerElement2) {
        // Let CSS handle the width with left/right positioning
        // This ensures the header maintains its spacing from both sides
        headerElement1.style.width = ""; // Remove any inline width
        headerElement2.style.width = ""; // Remove any inline width

        // For header2, we still need to set a width that matches the content area
        const contentWidth = document.querySelector(".maindiv")?.clientWidth || window.innerWidth - 36; // 36px = 2.25rem * 16px (left + right margins)
        headerElement2.style.width = contentWidth + "px";
      }
    };

    const handleScroll = () => {
      const headerElement1 = document.getElementById("table-header-1");
      const headerElement2 = document.getElementById("table-header-2");

      if (headerElement1 && headerElement2) {
        // Use fixed values for header positioning
        headerElement1.style.top = "8px";

        // Position the second header below the first one
        const firstHeaderHeight = headerElement1.offsetHeight || 32;
        headerElement2.style.top = (8 + firstHeaderHeight) + "px";
      }
    };
    vscode.addScrollerListener(handleScroll);

    // Call handleScroll once to set initial positions
    setTimeout(handleScroll, 0);
    vscode.addResizeListener(handleResize);

    vscode.postVscMessage({ command: "init" });

    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);

  return (
    <div className="maindiv" data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>
      <table id="table-1" className="border-collapse">
        <thead id="table-header-1" className="table-header1">
          <th id="th-1" className="header-cell-1">
            <Breadcrumb
              profileHandler={resourceInfo?.profileHandler ?? []}
              resourceName={resourceInfo?.name}
              humanReadableNameSingular={resourceInfo?.humanReadableNameSingular}
              iconsMapping={resourceInfo?.iconsMapping}
            />
            {resourceInfo && <Contextmenu resourceActions={resourceActions} refreshIconPath={resourceInfo?.refreshIconPath} />}
          </th>
        </thead>
        <tbody className="padding-left-10">
          {resourceInfo?.highlights.length > 0 && (
            <tr className="tr-class">
              {resourceInfo.highlights.map((highlight) => (
                <td key={highlight.key} className="td-class">
                  <span className="highlight-key">{highlight.key}:</span> <span className="highlight-value">{highlight.value}</span>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>

      <table className="border-collapse">
        <thead id="table-header-2" className="thead-2">
          <tr>
            <th className="th-header-single" colSpan={2}>
              <div className="header-container">
                <div className="width-30" style={{ height: "16px", lineHeight: "16px" }}>
                  <span className="header-label">ATTRIBUTE</span>
                </div>
                <div className="width-70" style={{ height: "16px", lineHeight: "16px" }}>
                  <span className="header-label-value">VALUE</span>
                </div>
                <VscodeTextfield
                  type="text"
                  placeholder="Keyword search..."
                  onInput={(e: { target: HTMLInputElement }) => setSearch(e.target.value)}
                  value={search}
                  className="search-style"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {resourceInfo &&
            Object.entries(resourceInfo.resource)
              .filter(([key, value]) => !key.startsWith("_"))
              .filter(
                ([key, value]) =>
                  key.toLowerCase().trim().includes(search.toLowerCase().trim()) || value.toLowerCase().trim().includes(search.toLowerCase().trim())
              )
              .map(([key, value]) => (
                <tr key={key}>
                  <td className="padding-left-27 width-30 highlight-value">{key.toUpperCase()}</td>
                  <td className="padding-right-75 width-70 highlight-value">{value}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceInspector;