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

import { IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
import * as React from "react";
import "../css/style.css";

interface IconPath {
  light: string;
  dark: string;
}

interface IBreadcrumbProps {
  resourceContext: IResourceProfileNameInfo;
  resourceName: string;
  resourceType: string;
  resourceIconPath: IconPath;
  isDarkTheme: boolean;
}

// Render icon using the provided icon path
const renderIcon = (resourceIconPath: IconPath, isDarkTheme: boolean, alt: string = "resource") => {
  const iconSrc = isDarkTheme ? resourceIconPath.dark : resourceIconPath.light;
  return <img src={iconSrc} alt={alt} width={16} height={16} />;
};

/**
 * Creates breadcrumb items array from profile handler and resource information
 */
const createBreadcrumbItems = (
  resourceContext: IResourceProfileNameInfo,
  resourceName: string,
  humanReadableNameSingular: string
): string[] => {
  const items = [resourceContext.regionName, `${resourceName} (${humanReadableNameSingular})`];
  if (resourceContext.cicsplexName) {
    items.unshift(resourceContext.cicsplexName);
  }
  return items;
};

const Breadcrumb = ({
  resourceContext,
  resourceName,
  resourceType,
  resourceIconPath,
  isDarkTheme,
}: IBreadcrumbProps) => {

  // Memoize items array to prevent unnecessary recalculations
  const items = React.useMemo(() =>
    createBreadcrumbItems(resourceContext, resourceName, resourceType),
    [resourceContext, resourceName, resourceType]);

  const renderBreadcrumbItem = (item: string, idx: number) => {
    const isResourceItem = idx === items.length - 1;
    const showChevron = idx > 0 && resourceIconPath;
    const chevron = <span className="codicon codicon-chevron-right" />;

    if (!isResourceItem) {
      return (
        <React.Fragment key={item}>
          {showChevron && <li>{chevron}</li>}
          <li>{item}</li>
        </React.Fragment>
      );
    }
    const icon = resourceIconPath ? renderIcon(resourceIconPath, isDarkTheme, resourceType) : null;

    return (
      <React.Fragment key={item}>
        {showChevron && <li>{chevron}</li>}
        <li className="resource-item">
          {icon && <span className="resource-icon">{icon}</span>}
          <span className="label-text-color">{resourceName}</span>
          {resourceType && <span>({resourceType})</span>}
        </li>
      </React.Fragment>
    );
  };

  return (
    <div id="breadcrumb-div" className="breadcrumb-div">
      <ul className="breadcrumb">
        {items.map(renderBreadcrumbItem)}
      </ul>
    </div>
  );
};

export default Breadcrumb;