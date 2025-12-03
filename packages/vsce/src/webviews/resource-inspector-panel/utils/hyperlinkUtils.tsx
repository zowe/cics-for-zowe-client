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
import { postVscMessage } from "../../common/vscode";

const HYPERLINKABLE_PATTERNS: RegExp[] = [/^\/\/DD:.+/];

/**
 * Check if a value matches any hyperlinkable pattern (//DD:* etc.)
 * @param value - The string value to check
 * @returns true if the value matches any hyperlinkable pattern, false otherwise
 */
export const isHyperlinkableValue = (value: string): boolean => {
  return HYPERLINKABLE_PATTERNS.some((pattern) => pattern.test(value));
};

/**
 * Render a value as a hyperlink if it matches a hyperlinkable pattern
 * @param value - The string value to render
 * @returns React node with hyperlink if pattern matches, otherwise the plain value
 */
export const renderHyperlinkableValue = (value: string): React.ReactNode => {
  if (isHyperlinkableValue(value)) {
    return (
      <a
        href="javascript:void(0)"
        className="hyperlinkable-value"
        onClick={(e) => {
          e.preventDefault();
          postVscMessage({
            command: "showLogsForHyperlink",
          });
        }}
      >
        {value}
      </a>
    );
  }
  return value;
};
