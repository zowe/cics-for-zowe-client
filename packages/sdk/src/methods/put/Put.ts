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
import { ICMCIApiResponse, IGetResourceUriOptions, IResourceParms } from "../../doc";
import { ICMCIRequestOptions } from "../../doc/ICMCIRequestOptions";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

/**
 * Put resources on in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IResourceParms} parms - parameters for getting resources
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS resource name not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function putResource(
  session: AbstractSession,
  parms: IResourceParms,
  headers: { [key: string]: string }[] = [],
  requestBody: any,
  requestOptions?: ICMCIRequestOptions
): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Resource name", "CICS resource name is required");

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: parms.criteria,
    parameter: parms.parameter,
    queryParams: parms.queryParams,
  };

  const cmciResource = Utils.getResourceUri(parms.name, options);

  Logger.getAppLogger().debug(
    "PUT request - Resource [" +
      parms.name +
      "]" +
      (parms.cicsPlex ? ", CICSplex [" + parms.cicsPlex + "]" : "") +
      (parms.regionName ? ", Region [" + parms.regionName + "]" : "") +
      (parms.criteria ? ", Criteria [" + parms.criteria + "]" : "") +
      (parms.parameter ? ", Parameter [" + parms.parameter + "]" : "")
  );

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, headers, requestBody, requestOptions);
}
