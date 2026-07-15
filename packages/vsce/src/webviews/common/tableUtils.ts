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

/**
 * Get zebra striping class name based on theme
 */
export const getZebraClass = (isDark: boolean): string => {
  return `zebra-${isDark ? "dark" : "light"}`;
};

/**
 * Get header background class based on theme
 */
export const getHeaderBgClass = (isDark: boolean): string => {
  return `bg-(--vscode-editor-background) ${isDark ? "bg-lighter" : "bg-darker"}`;
};

/**
 * Get alternating row background color for sticky columns
 */
export const getRowBgClass = (rowIndex: number, isDark: boolean): string => {
  return rowIndex % 2 === 0
    ? "bg-(--vscode-editor-background)"
    : isDark
    ? "bg-[color-mix(in_srgb,var(--vscode-editor-background),white_3%)]"
    : "bg-[color-mix(in_srgb,var(--vscode-editor-background),black_5%)]";
};

/**
 * Get search input background class based on theme
 */
export const getSearchInputBgClass = (isDark: boolean): string => {
  return isDark ? "bg-darker" : "bg-lighter";
};

/**
 * Common table cell classes
 */
export const TABLE_CELL_CLASSES = "pl-4 wrap-anywhere min-w-48";

/**
 * Common sticky header z-index
 */
export const STICKY_HEADER_Z_INDEX = 60;

/**
 * Sticky level increment for nested sticky elements
 */
export const STICKY_LEVEL_INCREMENT = 8;
