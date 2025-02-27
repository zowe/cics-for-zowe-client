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
import { CicsCmciConstants } from "../../constants";
import { ICMCIApiResponse, IGetResourceUriOptions, IProgramParms } from "../../doc";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

/**
 * Refresh a program definition on CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IProgramParms} parms - parameters for refreshing your program
 * @returns {Promise<any>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS program name not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export function programNewcopy(session: AbstractSession, parms: IProgramParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Program name", "CICS program name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to refresh a program with the following parameters:\n%s", JSON.stringify(parms));
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "NEWCOPY",
        },
      },
    },
  };

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `PROGRAM=${parms.name}`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_PROGRAM_RESOURCE, options);

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody) as any;
}
