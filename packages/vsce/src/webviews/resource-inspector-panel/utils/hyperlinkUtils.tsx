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

// Pattern for MVS dataset names (e.g., A.B.C, MY.DATASET, SYS1.PROCLIB)
// Dataset names can have 1-44 characters, with qualifiers separated by dots
// Each qualifier can be 1-8 characters, alphanumeric plus national characters (@, #, $)
const DATASET_PATTERN = /^[A-Z0-9@#$]{1,8}(\.[A-Z0-9@#$]{1,8}){0,21}$/;

const HYPERLINKABLE_PATTERNS: RegExp[] = [JOB_SPOOL_PATTERN];

/**
 * Check if a value matches the dataset pattern
 * @param value - The string value to check
 * @returns true if the value matches the dataset pattern, false otherwise
 */
export const isDatasetValue = (value: string): boolean => {
  return typeof value === "string" && DATASET_PATTERN.test(value);
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
 * Render a value as a hyperlink if it matches a hyperlinkable pattern
 * @param value - The string value to render
 * @param ctx - The resource context
 * @param attributeName - The name of the attribute (optional, used to identify dataset attributes)
 * @returns React node with hyperlink if pattern matches, otherwise the plain value
 */
export const renderHyperlinkableValue = (value: string, ctx: IResourceContext, attributeName?: string) => {
  // Check for job spool pattern (//DD:*)
  if (isHyperlinkableValue(value)) {
    return (
      <a
        href="javascript:void(0)"
        className="underline cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          postVscMessage({
            type: "showLogsForHyperlink",
            resourceContext: ctx,
          });
        }}
      >
        {value}
      </a>
    );
  }

  // Check for dataset pattern (for dsname and librarydsn attributes)
  const isDatasetAttribute = attributeName === "dsname" || attributeName === "librarydsn";
  if (isDatasetAttribute && isDatasetValue(value)) {
    return (
      <a
        href="javascript:void(0)"
        className="underline cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          postVscMessage({
            type: "showDatasetForHyperlink",
            resourceContext: ctx,
            datasetName: value,
          });
        }}
      >
        {value}
      </a>
    );
  }

  return value;
};
