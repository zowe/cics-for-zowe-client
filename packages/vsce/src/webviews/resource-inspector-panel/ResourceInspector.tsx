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

  // Utility function to get DOM elements needed for layout
  const getLayoutElements = () => {
    const headerElement1 = document.getElementById("resource-info-table-header");
    const headerElement2 = document.getElementById("attributes-header");
    const mainDiv = document.querySelector(".resource-inspector-container");
    return { headerElement1, headerElement2, mainDiv };
  };

  // Utility function to get CSS variables
  const getCssVariables = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      headerTopSpacing: styles.getPropertyValue('--header-top-spacing'),
      maskTopPosition: styles.getPropertyValue('--mask-top-position'),
      maskLeftPosition: styles.getPropertyValue('--mask-left-position')
    };
  };

  const handleActionClick = (actionId: string) => {
    vscode.postVscMessage({ command: "action", actionId });
  };

  // Common function to handle attribute header mask creation and positioning
  const createOrUpdateMaskElement = (id: string, className: string) => {
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement("div");
      element.id = id;
      element.className = className;
      document.body.appendChild(element);
    }
    return element;
  };

  const updateAttributeHeaderMaskWithScroll = (headerElement: HTMLElement | null, createIfMissing: boolean = false) => {
    if (!headerElement) return;
    let attrHeaderMask = document.getElementById("attribute-header-mask");
    if (!attrHeaderMask && createIfMissing) {
      attrHeaderMask = createOrUpdateMaskElement("attribute-header-mask", "attribute-header-mask");
    }
    
    if (attrHeaderMask) {
      const attrHeaderRect = headerElement.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 0) {
        attrHeaderMask.style.display = "block";
        attrHeaderMask.style.top = attrHeaderRect.top + "px";
        attrHeaderMask.style.height = attrHeaderRect.height + "px";
        attrHeaderMask.style.left = attrHeaderRect.left + "px";
        attrHeaderMask.style.width = attrHeaderRect.width + "px";
      } else {
        attrHeaderMask.style.display = "none";
      }
    }
  };
  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      setResourceInfo(event.data.data);
      setResourceActions(event.data.actions);
    };
    vscode.addVscMessageListener(listener);
    const handleResize = () => {
      const { headerElement1, headerElement2, mainDiv } = getLayoutElements();

      if (headerElement1 && headerElement2 && mainDiv) {
        headerElement1.style.width = "";
        const contentWidth = mainDiv.clientWidth;
        headerElement2.style.width = contentWidth + "px";
        const maskElement = createOrUpdateMaskElement("header-mask", "header-mask");
        maskElement.style.width = "100%";
        updateAttributeHeaderMaskWithScroll(headerElement2, false);
      }
    };

    const handleScroll = () => {
      const { headerElement1, headerElement2, mainDiv } = getLayoutElements();
  
      if (headerElement1 && headerElement2 && mainDiv) {
        // Get CSS variables
        const { headerTopSpacing, maskTopPosition, maskLeftPosition } = getCssVariables();
        headerElement1.style.top = headerTopSpacing;
        const firstHeaderHeight = headerElement1.offsetHeight;
        const headerTopSpacingValue = parseInt(headerTopSpacing);
        headerElement2.style.top = `${headerTopSpacingValue + firstHeaderHeight}px`;
        const contentWidth = mainDiv.clientWidth;
        headerElement2.style.width = contentWidth + "px";
        const maskElement = createOrUpdateMaskElement("header-mask", "header-mask");
        maskElement.style.top = maskTopPosition;
        maskElement.style.height = `${headerTopSpacingValue + firstHeaderHeight}px`;
        maskElement.style.left = maskLeftPosition;
        maskElement.style.width = "100%";
        updateAttributeHeaderMaskWithScroll(headerElement2, true);
      }
    };
    vscode.addScrollerListener(handleScroll);
    setTimeout(() => {
      handleScroll();
      handleResize();
    }, 0);
    vscode.addResizeListener(handleResize);
    vscode.postVscMessage({ command: "init" });
    return () => {
      vscode.removeVscMessageListener(listener);
      const headerMask = document.getElementById("header-mask");
      if (headerMask) {
        headerMask.remove();
      }
      const attrHeaderMask = document.getElementById("attribute-header-mask");
      if (attrHeaderMask) {
        attrHeaderMask.remove();
      }
      window.removeEventListener('resize', handleResize);
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
                  resourceType={resourceInfo?.humanReadableNameSingular}
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