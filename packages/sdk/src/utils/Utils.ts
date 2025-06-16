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
import { IResultCacheParms } from "../doc/IResultCacheParms";

/**
 * Class for providing static utility methods
 * @export
 * @class Utils
 */
export class Utils {
  public static getCacheUri(cacheToken: string, options?: IResultCacheParms): string {
    ImperativeExpect.toBeDefinedAndNonBlank(cacheToken, "CICS Results Cache Token", "CICS Results Cache Token is required");

    let cmciResource = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${CicsCmciConstants.CICS_RESULT_CACHE}/${cacheToken}`;

    if (options && options.startIndex) {
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

    if (options && options.summonly) {
      cmciResource += `${delimiter}${CicsCmciConstants.SUMM_ONLY}`;
    }

    return cmciResource;
  }
}
