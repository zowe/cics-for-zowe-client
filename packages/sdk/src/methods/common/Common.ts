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

import { ImperativeExpect } from "@zowe/imperative";
import { CicsCmciConstants } from "../../constants";

/**
 * Get uri for requesting a resources in CICS through CMCI REST API
 * @param {string} cicsPlexName - CICSplex name
 * @param {string} regionName - CICS region name
 * @param {string} resourceName - CMCI resource name
 * @param {string} criteria - criteria string
 * @param {string} parameter - parameter string
 * @returns {string} return a string containing the resource uri
 */
export function getResourceUri(cicsPlexName: string, regionName: string, resourceName: string, criteria?: string, parameter?: string) {
  ImperativeExpect.toBeDefinedAndNonBlank(resourceName, "CICS Resource name", "CICS resource name is required");

  let delimiter = "?"; // initial delimiter

  const cicsPlex = cicsPlexName == null ? "" : cicsPlexName + CicsCmciConstants.SEPERATOR;
  const region = regionName == null ? "" : regionName;

  let cmciResource = CicsCmciConstants.SEPERATOR + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
                     CicsCmciConstants.SEPERATOR + resourceName + CicsCmciConstants.SEPERATOR +
                     cicsPlex + region;

  if (criteria != null && criteria.length > 0) {
    let addParentheses = criteria.charAt(0) !== '(';

    cmciResource = cmciResource + delimiter + "CRITERIA=" + (addParentheses ? "(": "") + encodeURIComponent(criteria) + (addParentheses ? ")": "") ;
    delimiter = "&";
  }

  if (parameter != null && parameter.length > 0) {
    cmciResource = cmciResource + delimiter + "PARAMETER=" + encodeURIComponent(parameter);
  }

  return cmciResource;
}

