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

import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { postVscMessage } from "../../common/vscode";

// Pattern for //DD:* format (job spool logs)
const JOB_SPOOL_PATTERN = /^\/\/DD:.+/;

// Pattern for MVS dataset names
const DATASET_PATTERN = /^([A-Z@#$][A-Z0-9@#$\-]{0,7}(\.[A-Z@#$][A-Z0-9@#$\-]{0,7}){1,4}|[A-Z@#$][A-Z0-9@#$\-]{0,7}(\.[A-Z@#$][A-Z0-9@#$\-]{0,7}){1,3}\([A-Z@#$][A-Z0-9@#$\-]{0,7}\))$/;

// Pattern for z/OS Unix System Services (USS) file paths
// Matches absolute paths starting with / (e.g., /u/user/file.txt, /var/log/app.log)
// Requires at least one non-slash character after the initial slash and no consecutive slashes
const USS_PATH_PATTERN = /^\/[a-zA-Z0-9_\-.]+(\/[a-zA-Z0-9_\-.]+)*$/;

const HYPERLINKABLE_PATTERNS: RegExp[] = [JOB_SPOOL_PATTERN];
const HYPERLINKABLE_PATTERNS_DATASET: RegExp[] = [DATASET_PATTERN];

/**
 * Check if a value matches any hyperlinkable pattern
 * @param value - The string value to check
 * @returns true if the value matches any hyperlinkable pattern for dataset, false otherwise
 */
export const isDatasetValue = (value: string): boolean => {
  return HYPERLINKABLE_PATTERNS_DATASET.some((pattern) => pattern.test(value));
};

/**
 * Check if a value matches any hyperlinkable pattern (//DD:* etc.)
 * @param value - The string value to check
 * @returns true if the value matches any hyperlinkable pattern, false otherwise
 */
export const isHyperlinkableValue = (value: string): boolean => {
  return HYPERLINKABLE_PATTERNS.some((pattern) => pattern.test(value));
};

/**
 * Check if a value matches a USS file path pattern
 * @param value - The string value to check
 * @returns true if the value matches a USS file path pattern, false otherwise
 */
export const isUssPathValue = (value: string): boolean => {
  return USS_PATH_PATTERN.test(value);
};

/**
 * Helper function to create a hyperlink element
 * @param value - The string value to display
 * @param onClick - The click handler function
 * @returns React anchor element
 */
const createHyperlink = (value: string, onClick: (e: React.MouseEvent) => void) => (
  <a href="javascript:void(0)" className="underline cursor-pointer" onClick={onClick}>
    {value}
  </a>
);

/**
 * Render a value as a hyperlink if it matches a hyperlinkable pattern
 * @param value - The string value to render
 * @param ctx - The resource context
 * @param attributeName - The name of the attribute (optional, used to identify dataset attributes)
 * @param shouldRenderDatasetLinks - Whether dataset links should be rendered
 * @returns React node with hyperlink if pattern matches, otherwise the plain value
 */
export const renderHyperlinkableValue = (value: string, ctx: IResourceContext, shouldRenderDatasetLinks: boolean = false) => {
  // Check for job spool pattern (//DD:*)
  if (isHyperlinkableValue(value)) {
    return createHyperlink(value, (e) => {
      e.preventDefault();
      postVscMessage({
        type: "showLogsForHyperlink",
        resourceContext: ctx,
      });
    });
  }

  // Check for USS file path pattern
  // Only render as hyperlink if Zowe Explorer links should be rendered
  if (isUssPathValue(value) && shouldRenderDatasetLinks) {
    return createHyperlink(value, (e) => {
      e.preventDefault();
      postVscMessage({
        type: "showUssFileForHyperlink",
        resourceContext: ctx,
        ussPath: value,
      });
    });
  }

  // Check for dataset pattern
  // Only render as hyperlink if Zowe Explorer links should be rendered
  if (isDatasetValue(value) && shouldRenderDatasetLinks) {
    return createHyperlink(value, (e) => {
      e.preventDefault();
      postVscMessage({
        type: "showDatasetForHyperlink",
        resourceContext: ctx,
        datasetName: value,
      });
    });
  }

  return value;
};
