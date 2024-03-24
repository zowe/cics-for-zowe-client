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
import { CicsCmciRestClient } from "../../rest";
import { CicsCmciConstants } from "../../constants";
import { IBaseParms, ICMCIApiResponse, IProgramParms, IURIMapParms } from "../../doc";

/**
 * Enable a URIMap installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IURIMapParms} parms - parameters for enabling your URIMap
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS URIMap name not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function enableUrimap(session: AbstractSession, parms: IURIMapParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS URIMap name", "CICS URIMap name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to enable a URIMap with the following parameters:\n%s", JSON.stringify(parms));

  const cicsPlex = parms.cicsPlex == null ? "" : parms.cicsPlex + "/";
  const cmciResource =
    "/" +
    CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
    "/" +
    CicsCmciConstants.CICS_URIMAP +
    "/" +
    cicsPlex +
    `${parms.regionName}?CRITERIA=(NAME=${parms.name})`;
  const requestBody: any = {
    request: {
      update: {
        attributes: {
          $: {
            ENABLESTATUS: "ENABLED",
          },
        },
      },
    },
  };
  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}

/**
 * Enable a transaction installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IURIMapParms} parms - parameters for enabling your transaction
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS Transaction name not defined or blank
 * @throws {ImperativeError} CICS Region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function enableTransaction(session: AbstractSession, parms: IBaseParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Transaction name", "CICS Transaction name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "ENABLE",
        },
      },
    },
  };

  const cicsPlex = parms.cicsPlex == null ? "" : parms.cicsPlex + "/";
  const cmciResource =
    "/" +
    CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
    "/" +
    CicsCmciConstants.CICS_LOCAL_TRANSACTION +
    "/" +
    cicsPlex +
    parms.regionName +
    "?CRITERIA=(TRANID=" +
    parms.name +
    ")";

  return await CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}

/**
 * Enable a program installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IURIMapParms} parms - parameters for enabling your program
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS Program name not defined or blank
 * @throws {ImperativeError} CICS Region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function enableProgram(session: AbstractSession, parms: IProgramParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Program name", "CICS Program name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "ENABLE",
        },
      },
    },
  };

  const cicsPlex = parms.cicsPlex == null ? "" : parms.cicsPlex + "/";
  const cmciResource =
    "/" +
    CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
    "/" +
    CicsCmciConstants.CICS_PROGRAM_RESOURCE +
    "/" +
    cicsPlex +
    parms.regionName +
    "?CRITERIA=(PROGRAM=" +
    parms.name +
    ")";

  return await CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}

/**
 * Enable a local file installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IURIMapParms} parms - parameters for enabling your local file
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS LocalFile name not defined or blank
 * @throws {ImperativeError} CICS Region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function enableLocalFile(session: AbstractSession, parms: IBaseParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS LocalFile name", "CICS LocalFile name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "ENABLE",
        },
      },
    },
  };

  const cicsPlex = parms.cicsPlex === undefined ? "" : parms.cicsPlex + "/";
  const cmciResource =
    "/" +
    CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
    "/" +
    CicsCmciConstants.CICS_LOCAL_FILE +
    "/" +
    cicsPlex +
    parms.regionName +
    "?CRITERIA=(FILE=" +
    parms.name +
    ")";

  return await CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}
