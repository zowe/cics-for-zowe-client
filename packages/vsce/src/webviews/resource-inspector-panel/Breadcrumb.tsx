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

import * as React from "react";
import '@vscode/codicons/dist/codicon.css';

import "../css/style.css";

/*Interface for resource type icons
"program":{
  light: url;
  dark: url;
};
}*/
interface IconPath {
  light: string;
  dark: string;
}

// Render icon using the provided icon path
const renderIcon = (iconPath: IconPath, isDarkTheme: boolean, alt: string = "resource") => {
  const iconSrc = isDarkTheme ? iconPath.dark : iconPath.light;
  return <img src={iconSrc} alt={alt} width={16} height={16} />;
};

/**
 * Creates breadcrumb items array from profile handler and resource information
 */
const createBreadcrumbItems = (
  profileHandler: { key: string; value: string }[],
  resourceName?: string,
  humanReadableNameSingular?: string
): { key: string; value: string }[] => {
  const filteredProfiles = profileHandler?.filter(p => p.value !== null && p.key !== "profile") ?? [];
  const resourceItem = resourceName ? {
    key: "resourceName",
    value: `${resourceName}${humanReadableNameSingular ? ` (${humanReadableNameSingular})` : ""}`
  } : null;
  return [...filteredProfiles, resourceItem].filter(Boolean) as { key: string; value: string }[];
};

const Breadcrumb = ({
  profileHandler,
  resourceName,
  resourceType,
  iconPath,
  isDarkTheme,
}: {
  profileHandler: { key: string; value: string }[];
  resourceName?: string;
  resourceType?: string;
  iconPath?: IconPath;
  isDarkTheme: boolean;
}) => {

  // Memoize items array to prevent unnecessary recalculations
  const items = React.useMemo(() =>
    createBreadcrumbItems(profileHandler, resourceName, resourceType),
    [profileHandler, resourceName, resourceType]);

  const renderBreadcrumbItem = (profile: { key: string; value: string }, idx: number) => {
    const isResourceItem = idx === items.length - 1 && profile.key === "resourceName";
    const showChevron = idx > 0 && iconPath;
    const chevron = showChevron ? <span className="codicon codicon-chevron-right" /> : null;

    if (!isResourceItem) {
      return (
        <React.Fragment key={profile.key}>
          {showChevron && <li>{chevron}</li>}
          <li>{profile.value}</li>
        </React.Fragment>
      );
    }
    const icon = iconPath ? renderIcon(iconPath, isDarkTheme, resourceType) : null;

    return (
      <React.Fragment key={profile.key}>
        {showChevron && <li>{chevron}</li>}
        <li className="resource-item">
          {icon && <span className="resource-icon">{icon}</span>}
          <span className="vscode-badge-foreground-color">{resourceName}</span>
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