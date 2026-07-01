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
 * Converts a filter pattern with wildcards into a regular expression
 * Supports comma-separated patterns and wildcards (*)
 *
 * @param pattern - Filter pattern (e.g., "CICS*", "CICS1,TEST*", or "*")
 * @returns Regular expression string for matching
 */
export function patternToRegex(pattern: string): string {
  const patternList = pattern.split(",");
  let patternString = "";

  for (const index in patternList) {
    const trimmedPattern = patternList[index].trim().replace(/\*/g, "(.*)");
    patternString += `(^${trimmedPattern}$)`;

    if (parseInt(index) !== patternList.length - 1) {
      patternString += "|";
    }
  }

  return patternString;
}

/**
 * Creates a RegExp object from a filter pattern, or null if pattern is "*"
 *
 * @param pattern - Filter pattern (e.g., "CICS*", "CICS1,TEST*", or "*")
 * @returns RegExp object for filtering, or null if pattern is "*" (match all)
 */
export function createFilterRegex(pattern: string): RegExp | null {
  if (!pattern || pattern === "*") {
    return null;
  }

  return new RegExp(patternToRegex(pattern));
}
