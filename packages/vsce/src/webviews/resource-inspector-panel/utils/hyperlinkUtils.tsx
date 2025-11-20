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
import { IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
import * as vscode from "../../common/vscode";

const HYPERLINKABLE_PATTERNS: RegExp[] = [/^\/\/DD:.+/];


/**
 * Check if a value matches any hyperlinkable pattern (//DD:*, USS paths, dataset names, etc.)
 * @param value - The string value to check
 * @returns true if the value matches any hyperlinkable pattern, false otherwise
 */
export const isHyperlinkableValue = (value: string): boolean => {
  return HYPERLINKABLE_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Render a value as a hyperlink if it matches a hyperlinkable pattern
 * @param value - The string value to render
 * @param resourceContext - The resource context containing profile, region, and plex information
 * @param onClickHandler - Optional click handler for the hyperlink
 * @returns React node with hyperlink if pattern matches, otherwise the plain value
 */
export const renderHyperlinkableValue = (
  value: string,
  resourceContext?: IResourceProfileNameInfo,
  onClickHandler?: (value: string, resourceContext?: IResourceProfileNameInfo) => void
): React.ReactNode => {
  if (isHyperlinkableValue(value)) {
    return (
      <a
        href="#"
        className="hyperlinkable-value"
        onClick={(e) => {
          e.preventDefault();
          if (onClickHandler) {
            onClickHandler(value, resourceContext);
          } else if (resourceContext) {
            (vscode.postVscMessage as any)({
              command: 'showLogsForHyperlink'
            });
          }
        }}
      >
        {value}
      </a>
    );
  }
  return value;
};
