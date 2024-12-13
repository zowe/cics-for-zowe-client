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
import { CicsCmciConstants } from "../constants";
import { IGetResourceUriOptions } from "../doc";

/**
 * Class for providing static utility methods
 * @export
 * @class Utils
 */
export class Utils {

  /**
   * Get uri for requesting a resources in CICS through CMCI REST API
   * @param {string} resourceName - CMCI resource name
   * @param {IGetResourceUriOptions} options - CMCI resource options
   */
  public static getResourceUri(resourceName: string, options?: IGetResourceUriOptions) : string {
    ImperativeExpect.toBeDefinedAndNonBlank(resourceName, "CICS Resource name", "CICS resource name is required");

    let delimiter = "?"; // initial delimiter

    const cicsPlex = (options && options.cicsPlex) == null ? "" : options.cicsPlex + CicsCmciConstants.SEPERATOR;
    const region = (options && options.regionName) == null ? "" : options.regionName;

    let cmciResource = CicsCmciConstants.SEPERATOR + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
                      CicsCmciConstants.SEPERATOR + resourceName + CicsCmciConstants.SEPERATOR +
                      cicsPlex + region;

    if (options != null) {
      if (options.criteria != null && options.criteria.length > 0) {
        const addParentheses = options.criteria.charAt(0) !== '(';

        cmciResource = cmciResource + delimiter + "CRITERIA=" + (addParentheses ? "(": "") +
        encodeURIComponent(options.criteria) + (addParentheses ? ")": "") ;
        delimiter = "&";
      }

      if (options.parameter != null && options.parameter.length > 0) {
        cmciResource = cmciResource + delimiter + "PARAMETER=" + encodeURIComponent(options.parameter);
      }
    }

    return cmciResource;
  }
}
