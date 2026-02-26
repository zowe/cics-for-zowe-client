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

import { useState } from "react";
import { Chevron } from "../common/Chevron";
import { useTheme } from "../common/ThemeContext";
import type { IResourceInspectorIconPath, IResourceInspectorResource } from "../common/vscode";
import { ContextMenu } from "./Contextmenu";

const SecondaryText = ({ txt, className = "" }: { txt: string; className?: string }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    <span className="text-(--vscode-disabledForeground)">{txt}</span>
    <Chevron />
  </div>
);

export const Breadcrumb = (props: {
  cicsplexName?: string;
  regionName?: string;
  resourceName?: string;
  resourceType?: string;
  resourceIconPath?: IResourceInspectorIconPath;
  actions?: { id: string; name: string }[];
  resources?: IResourceInspectorResource[];
  tabIndex?: number;
  showContextMenu?: boolean;
}) => {
  const { isDark } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  const profileName = props.resources?.[0]?.context?.profile?.name;
  const showFullPath = profileName || props.cicsplexName;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1 relative"
        onMouseOver={() => showFullPath && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {showFullPath && showTooltip && (
          <div
            className={
              "bg-(--vscode-editor-background) rounded-md shadow-lg text-(--vscode-foreground)" +
              " text-xs border border-[color-mix(in_srgb,var(--vscode-disabledForeground),black_50%)]" +
              " px-2 py-1 absolute left-0 top-5 flex items-center gap-1 z-20"
            }
          >
            {profileName && (
              <>
                <span>{profileName}</span>
                <Chevron />
              </>
            )}
            {props.cicsplexName && (
              <>
                <span>{props.cicsplexName}</span>
                <Chevron />
              </>
            )}
            {props.regionName && <span>{props.regionName}</span>}
          </div>
        )}

        {props.cicsplexName && <SecondaryText txt={props.cicsplexName} className="hidden md:flex" />}
        {props.regionName && <SecondaryText txt={props.regionName} className="hidden md:flex" />}

        <div className="flex gap-1 items-center">
          {props.resourceIconPath && (
            <img src={isDark ? props.resourceIconPath.dark : props.resourceIconPath.light} alt="RES" width="16px" height="16px" />
          )}
          {props.resourceName ?
            <>
              <span className="font-normal">{props.resourceName}</span>
              {props.resourceType && <span className="text-(--vscode-disabledForeground) font-normal">({props.resourceType})</span>}
            </>
          : props.resourceType && <span className="font-normal">{props.resourceType}</span>}
        </div>
      </div>

      {props.showContextMenu !== false && props.actions && props.actions.length > 0 && props.resources && (
        <ContextMenu
          tabIndex={props.tabIndex}
          data={props.actions.map((ac) => ({
            label: ac.name,
            value: ac.id,
            resourceName: props.resourceName || "",
            resourceContext: props.resources[0].context,
            resources: props.resources,
          }))}
        />
      )}
    </div>
  );
};
