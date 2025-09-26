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

import "../css/style.css";

/*Interface for resource type icons
Keys are strings (representing resource types like "program", "transaction")
Values are objects with "light" and "dark" string properties (the URIs for each theme)*/
interface IconsMapping {
  [key: string]: {
    light: string;
    dark: string;
  };
}


// Get icon based on resource type using the provided icon paths
const getIconByType = (type: string, iconsMapping?: IconsMapping) => {
  const iconType = type.toLowerCase();
  let iconPath = iconsMapping[iconType];
  //if icon is not found we can provide some default one
  iconPath = !iconPath && iconsMapping.program ? iconsMapping.program : iconPath;
  const isDarkTheme = document.body.classList.contains("vscode-dark") || document.body.classList.contains("vscode-high-contrast");
  const iconSrc = isDarkTheme ? iconPath.dark : iconPath.light;
  return <img src={iconSrc} alt={type} width={16} height={16} />;
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
  const items = [
    ...(profileHandler?.filter((p) => p.value !== null && p.value != "VSCPLEX") ?? []),
    resourceName ?
      {
        key: "resourceName",
        value: `${resourceName}${humanReadableNameSingular ? ` (${humanReadableNameSingular})` : ""}`,
      }
    : null,
  ].filter(Boolean) as { key: string; value: string }[];

  return (
    <div id="breadcrumb-div" className="breadcrumb-div">
      <ul className="breadcrumb">
        {items.map((profile, idx) => {
          const isResourceItem = idx === items.length - 1 && profile.key === "resourceName";
          const chevron = idx > 0 && iconsMapping ? getIconByType("chevron", iconsMapping) : null;

          if (isResourceItem) {
            // Extract the type from the value (text inside parentheses)
            const match = profile.value.match(/\(([^)]+)\)/);
            const type = match ? match[1] : "program"; // Default to program if no type found
            const icon = iconsMapping ? getIconByType(type, iconsMapping) : null;

            // Split the profile value into the main part and the part in parentheses
            const resourceName = profile.value.split(" (")[0];
            const resourceType = match ? ` (${match[1]})` : "";

            return (
              <React.Fragment key={profile.key}>
                {idx > 0 && <li className="chevron-icon">{chevron}</li>}
                <li className="resource-item">
                  {icon && <span className="resource-icon">{icon}</span>}
                  <span className="white-color">{resourceName}</span>
                  <span>{resourceType}</span>
                </li>
              </React.Fragment>
            );
          } else {
            return (
              <React.Fragment key={profile.key}>
                {idx > 0 && <li className="chevron-icon">{chevron}</li>}
                <li className="resource-item">{profile.value}</li>
              </React.Fragment>
            );
          }
        })}
      </ul>
    </div>
  );
};

export default Breadcrumb