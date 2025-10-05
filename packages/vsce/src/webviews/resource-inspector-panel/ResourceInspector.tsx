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
      const headerElement1 = document.getElementById("resource-info-table-header");
      const headerElement2 = document.getElementById("attributes-header");
      const mainDiv = document.querySelector(".resource-inspector-container");

      if (headerElement1 && headerElement2 && mainDiv) {
        headerElement1.style.width = "";
        const contentWidth = mainDiv.clientWidth || window.innerWidth - 36;
        headerElement2.style.width = contentWidth + "px";
        const maskElement = document.getElementById("header-mask");
        if (maskElement) {
          maskElement.style.width = "100%";
        }
      }
    };

    const handleScroll = () => {
      const headerElement1 = document.getElementById("resource-info-table-header");
      const headerElement2 = document.getElementById("attributes-header");
      const mainDiv = document.querySelector(".resource-inspector-container");

      if (headerElement1 && headerElement2 && mainDiv) {
        headerElement1.style.top = "8px";
        const firstHeaderHeight = headerElement1.offsetHeight || 32;
        headerElement2.style.top = (8 + firstHeaderHeight) + "px";
        const contentWidth = mainDiv.clientWidth || window.innerWidth - 36;
        headerElement2.style.width = contentWidth + "px";
        let maskElement = document.getElementById("header-mask");
        if (!maskElement) {
          maskElement = document.createElement("div");
          maskElement.id = "header-mask";
          maskElement.className = "header-mask";
          document.body.appendChild(maskElement);
        }
        maskElement.style.top = "0px";
        maskElement.style.height = (8 + firstHeaderHeight) + "px";
        maskElement.style.left = "0px";
        maskElement.style.width = "100%";
      }
    };
    vscode.addScrollerListener(handleScroll);
    setTimeout(() => {
      handleScroll();
      handleResize();
    }, 0);
    vscode.addResizeListener(handleResize);
    window.addEventListener('resize', handleResize);
    vscode.postVscMessage({ command: "init" });
    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);
  return (
    <div className="resource-inspector-container" data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>
      <table id="resource-info-table" className="border-collapse">
        <thead id="resource-info-table-header" className="resource-info-table-header">
          <th id="resource-title" className="resource-title">
            <div className="resource-title-container">
              <div className="breadcrumb-container">
                <Breadcrumb
                  profileHandler={resourceInfo?.profileHandler ?? []}
                  resourceName={resourceInfo?.name}
                  humanReadableNameSingular={resourceInfo?.humanReadableNameSingular}
                  iconsMapping={resourceInfo?.iconsMapping}
                />
              </div>
              <div className="context-menu-container">
                {resourceInfo && <Contextmenu resourceActions={resourceActions} refreshIconPath={resourceInfo?.refreshIconPath} />}
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
          {resourceInfo &&
            Object.entries(resourceInfo.resource)
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