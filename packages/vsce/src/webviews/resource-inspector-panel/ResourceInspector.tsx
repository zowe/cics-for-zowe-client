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
import useThemeDetection from "./hooks/useThemeDetection";
import useLayoutManager from "./hooks/useLayoutManager";

const ResourceInspector = () => {
  const [search, setSearch] = React.useState("");
  const isDarkTheme = useThemeDetection();

  const [resourceInfo, setResourceInfo] = React.useState<{
    name: string;
    refreshIconPath: { light: string; dark: string };
    resourceIconPath?: { light: string; dark: string };
    humanReadableNameSingular: string;
    highlights: { key: string; value: string; }[];
    resource: IResource;
    profileHandler: { key: string; value: string; }[];
  }>();
  const [resourceActions, setResourceActions] = React.useState<{
    id: string;
    name: string;
  }[]>([]);

  // Use the layout manager hook to handle DOM-related operations
  const { containerRef } = useLayoutManager();

  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      setResourceInfo(event.data.data);
      setResourceActions(event.data.actions);
    };
    vscode.addVscMessageListener(listener);
    vscode.postVscMessage({ command: "init" });
    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);
  return (
    <div
      className="resource-inspector-container"
      data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'
      ref={containerRef}
    >
      <table id="resource-info-table" className="border-collapse">
        <thead id="resource-info-table-header" className="resource-info-table-header">
          <th id="resource-title" className="resource-title">
            <div className="resource-title-container">
              <div className="breadcrumb-container">
                <Breadcrumb
                  profileHandler={resourceInfo?.profileHandler ?? []}
                  resourceName={resourceInfo?.name}
                  resourceType={resourceInfo?.humanReadableNameSingular}
                  resourceIconPath={resourceInfo?.resourceIconPath}
                  isDarkTheme={isDarkTheme}
                />
              </div>
              <div className="context-menu-container">
                {resourceInfo && <Contextmenu
                  resourceActions={resourceActions}
                  refreshIconPath={resourceInfo?.refreshIconPath}
                  isDarkTheme={isDarkTheme}
                />}
              </div>
            </div>
          </th>
        </thead>
        <tbody className="padding-left-10">
          {resourceInfo?.highlights.length > 0 && (
            <tr className="resource-info-rows">
              {resourceInfo.highlights.map((highlight) => (
                <td key={highlight.key} className="resource-info-row">
                  <span className="vscode-breadcrumb-foreground-color">{highlight.key}:</span> <span className="vscode-badge-foreground-color">{highlight.value}</span>
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      <table className="border-collapse">
        <thead id="attributes-header" className="attributes-header-section">
          <tr>
            <th className="attributes-title" colSpan={2}>
              <div className="attributes-header-row">
                <div className="header-label-div">
                  <span className="header-label">ATTRIBUTE</span>
                </div>
                <div className="header-label-value-div">
                  <span className="header-label-value">VALUE</span>
                </div>
                <VscodeTextfield
                  type="text"
                  placeholder="Keyword search..."
                  onInput={(e: { target: HTMLInputElement }) => setSearch(e.target.value)}
                  value={search}
                  className="attribute-search"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {resourceInfo && Object.entries(resourceInfo.resource)
              .filter(([key, value]) => !key.startsWith("_"))
              .filter(
                ([key, value]) =>
                  key.toLowerCase().trim().includes(search.toLowerCase().trim()) || value.toLowerCase().trim().includes(search.toLowerCase().trim())
              )
              .map(([key, value]) => (
                <tr key={key}>
                  <td className="resource-attr-key">{key.toUpperCase()}</td>
                  <td className="resource-attr-value">{value}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceInspector;