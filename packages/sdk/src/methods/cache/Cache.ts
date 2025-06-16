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

import { AbstractSession, ImperativeExpect, Logger } from "@zowe/imperative";
import { ICMCIApiResponse } from "../../doc";
import { ICacheParms } from "../../doc/ICacheParms";
import { IResultCacheParms } from "../../doc/IResultCacheParms";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

export async function getCache(session: AbstractSession, parms: ICacheParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.cacheToken, "CICS Result Cache Token", "CICS Result Cache Token is required");
  Logger.getAppLogger().debug("Attempting to get cache with the following parameters:\n%s", JSON.stringify(parms));

  const options: IResultCacheParms = {
    count: parms.count,
    startIndex: parms.startIndex,
    summonly: parms.summonly,
    nodiscard: parms.nodiscard,
  };
  const cmciResource = Utils.getCacheUri(parms.cacheToken, options);

  return CicsCmciRestClient.getExpectParsedXml(session, cmciResource, []);
}
