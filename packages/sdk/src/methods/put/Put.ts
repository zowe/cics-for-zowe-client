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
import { ICMCIApiResponse, IGetResourceUriOptions, IResourceQueryParams } from "../../doc";
import { ICMCIRequestOptions } from "../../doc/ICMCIRequestOptions";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

/**
 * Get resources on in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IResourceParms} parms - parameters for getting resources
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS resource name not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function putResource(
   {
    session,
    resourceName,
    regionName,
    cicsPlex,
    params,
    requestOptions
  }: {
    session: AbstractSession;
    resourceName: string;
    regionName?: string;
    cicsPlex?: string;
    params?: { criteria?: string; parameter?: string; queryParams?: IResourceQueryParams };
    requestOptions?: ICMCIRequestOptions
  },
  requestBody: any
): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(resourceName, "CICS Resource name", "CICS resource name is required");

  const options: IGetResourceUriOptions = {
    cicsPlex: cicsPlex,
    regionName: regionName,
    ...params,
  };
  const cmciResource = Utils.getResourceUri(resourceName, options);

  Logger.getAppLogger().debug("PUT request - Resource [" + resourceName + "]" +
    (cicsPlex ? ", CICSplex [" + cicsPlex + "]" : "") +
    (regionName ? ", Region [" + regionName + "]" : "") +
    (params?.criteria ? ", Criteria [" + params?.criteria + "]" : "") +
    (params?.parameter ? ", Parameter [" + params?.parameter + "]" : ""));

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody, requestOptions);
}
