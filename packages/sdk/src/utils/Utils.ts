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
import type { IGetResourceUriOptions } from "../doc";
import type { IResultCacheParms } from "../doc/IResultCacheParms";

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
  public static getResourceUri(resourceName: string, options?: IGetResourceUriOptions): string {
    ImperativeExpect.toBeDefinedAndNonBlank(resourceName, "CICS Resource name", "CICS resource name is required");

    let delimiter = "?"; // initial delimiter

    const cicsPlex = options?.cicsPlex == null ? "" : `${encodeURIComponent(options.cicsPlex)}/`;
    const region = options?.regionName == null ? "" : encodeURIComponent(options.regionName);

    let cmciResource = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resourceName}/${cicsPlex}${region}`;

    if (options?.criteria) {
      cmciResource += `${delimiter}${CicsCmciConstants.CRITERIA}=${this.enforceParentheses(encodeURIComponent(options.criteria))}`;
      delimiter = "&";
    }

    if (options?.parameter) {
      cmciResource += `${delimiter}PARAMETER=${encodeURIComponent(options.parameter)}`;
      delimiter = "&";
    }

    if (options?.queryParams?.summonly) {
      cmciResource += `${delimiter}${CicsCmciConstants.SUMM_ONLY}`;
      delimiter = "&";
    }

    if (options?.queryParams?.nodiscard) {
      cmciResource += `${delimiter}${CicsCmciConstants.NO_DISCARD}`;
      delimiter = "&";
    }

    if (options?.queryParams?.overrideWarningCount) {
      cmciResource += `${delimiter}${CicsCmciConstants.OVERRIDE_WARNING_COUNT}`;
    }

    return cmciResource;
  }

  public static getCacheUri(cacheToken: string, options?: IResultCacheParms): string {
    ImperativeExpect.toBeDefinedAndNonBlank(cacheToken, "CICS Results Cache Token", "CICS Results Cache Token is required");

    let cmciResource = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${CicsCmciConstants.CICS_RESULT_CACHE}/${cacheToken}`;

    if (options?.startIndex) {
      cmciResource += `/${options.startIndex}`;

      if (options.count) {
        cmciResource += `/${options.count}`;
      }
    }

    let delimiter = "?";

    // Add NODISCARD unless explicitally told not to
    if (!options || options.nodiscard == null || options.nodiscard === true) {
      cmciResource += `${delimiter}${CicsCmciConstants.NO_DISCARD}`;
      delimiter = "&";
    }

    if (options?.summonly) {
      cmciResource += `${delimiter}${CicsCmciConstants.SUMM_ONLY}`;
    }

    return cmciResource;
  }

  public static enforceParentheses(input: string): string {
    return input.startsWith("(") ? input : `(${input})`;
  }
}
