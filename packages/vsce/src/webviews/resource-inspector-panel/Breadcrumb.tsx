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
import { useState, useEffect } from "react";
import '@vscode/codicons/dist/codicon.css';

import "../css/style.css";

/*Interface for resource type icons
"program":{
  light: url;
  dark: url;
};
}*/
interface IconsMapping {
  [key: string]: {
    light: string;
    dark: string;
  };
}


// Get icon based on resource type using the provided icon paths
const getIconByType = (type: string, isDarkTheme: boolean, iconsMapping?: IconsMapping) => {
  const iconType = type.toLowerCase();
  let iconPath = iconsMapping[iconType];
  //if icon is not found we can provide some default one
  iconPath = !iconPath && iconsMapping.program ? iconsMapping.program : iconPath;
  const iconSrc = isDarkTheme ? iconPath.dark : iconPath.light;
  return <img src={iconSrc} alt={type} width={16} height={16} />;
};

function isDarkThemeActive(): boolean {
  return document.body.classList.contains("vscode-dark") || (document.body.classList.contains("vscode-high-contrast") && !document.body.classList.contains("vscode-high-contrast-light"));
}

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


const extractResourceType = (value: string): { resourceName: string, resourceType: string } => {
  const typeMatch = value.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (typeMatch) {
    return {
      resourceName: typeMatch[1].trim(),
      resourceType: typeMatch[2]
    };
  }
  return {
    resourceName: value,
    resourceType: ""
  };
};

const Breadcrumb = ({
  profileHandler,
  resourceName,
  humanReadableNameSingular,
  iconsMapping,
}: {
  profileHandler: { key: string; value: string }[];
  resourceName?: string;
  humanReadableNameSingular?: string;
  iconsMapping?: IconsMapping;
}) => {
  const [isDarkTheme, setIsDarkTheme] = useState(isDarkThemeActive());
  useEffect(() => {
    const updateTheme = () => setIsDarkTheme(isDarkThemeActive());
    window.addEventListener("vscode-theme-changed", updateTheme);
    // Create a MutationObserver to watch for class changes on the body element
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          updateTheme();
        }
      }
    });
    observer.observe(document.body, { attributes: true });
    return () => {
      window.removeEventListener("vscode-theme-changed", updateTheme);
      observer.disconnect();
    };
  }, []);

  // Memoize items array to prevent unnecessary recalculations
  const items = React.useMemo(() =>
    createBreadcrumbItems(profileHandler, resourceName, humanReadableNameSingular),
    [profileHandler, resourceName, humanReadableNameSingular]);

  const renderBreadcrumbItem = (profile: { key: string; value: string }, idx: number) => {
    const isResourceItem = idx === items.length - 1 && profile.key === "resourceName";
    const showChevron = idx > 0 && iconsMapping;
    const chevron = showChevron ? <span className="codicon codicon-chevron-right" /> : null;

    if (!isResourceItem) {
      return (
        <React.Fragment key={profile.key}>
          {showChevron && <li>{chevron}</li>}
          <li>{profile.value}</li>
        </React.Fragment>
      );
    }

    const { resourceName, resourceType } = extractResourceType(profile.value);
    const icon = iconsMapping ? getIconByType(resourceType, isDarkTheme, iconsMapping) : null;

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