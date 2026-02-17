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

import { type AbstractSession, ImperativeExpect, Logger } from "@zowe/imperative";
import type { ICMCIApiResponse } from "../../doc";
import type { ICMCIRequestOptions } from "../../doc/ICMCIRequestOptions";
import type { ICacheParms } from "../../doc/ICacheParms";
import type { IResultCacheParms } from "../../doc/IResultCacheParms";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

export async function getCache(
  session: AbstractSession,
  parms: ICacheParms,
  requestOptions?: ICMCIRequestOptions,
  headers: { [key: string]: string }[] = []
): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.cacheToken, "CICS Result Cache Token", "CICS Result Cache Token is required");
  Logger.getAppLogger().debug("Attempting to get cache with the following parameters:\n%s", JSON.stringify(parms));

  const options: IResultCacheParms = {
    count: parms.count,
    startIndex: parms.startIndex,
    summonly: parms.summonly,
    nodiscard: parms.nodiscard,
  };
  const cmciResource = Utils.getCacheUri(parms.cacheToken, options);

  return CicsCmciRestClient.getExpectParsedXml(session, cmciResource, headers, requestOptions);
}
