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
import { ICMCIApiResponse, IGetResourceUriOptions, IProgramParms, IURIMapParms } from "../../doc";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

/**
 * Install a program definition to CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IProgramParms} parms - parameters for installing your program
 * @returns {Promise<any>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS program name not defined or blank
 * @throws {ImperativeError} CICS CSD group not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export function installProgram(session: AbstractSession, parms: IProgramParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Program name", "CICS program name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdGroup, "CICS CSD Group", "CICS CSD group is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to install a program with the following parameters:\n%s", JSON.stringify(parms));
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "CSDINSTALL",
        },
      },
    },
  };

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `NAME=${parms.name}`,
    parameter: `CSDGROUP(${parms.csdGroup})`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_DEFINITION_PROGRAM, options);

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody) as any;
}

/**
 * Install a transaction definition to CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IProgramParms} parms - parameters for installing your transaction
 * @returns {Promise<any>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS transaction name not defined or blank
 * @throws {ImperativeError} CICS CSD group not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export function installTransaction(session: AbstractSession, parms: IProgramParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Transaction name", "CICS transaction name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdGroup, "CICS CSD Group", "CICS CSD group is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to install a transaction with the following parameters:\n%s", JSON.stringify(parms));
  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "CSDINSTALL",
        },
      },
    },
  };

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `NAME=${parms.name}`,
    parameter: `CSDGROUP(${parms.csdGroup})`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_DEFINITION_TRANSACTION, options);

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody) as any;
}

/**
 * Install a URIMap installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IURIMapParms} parms - parameters for enabling your URIMap
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS URIMap name not defined or blank
 * @throws {ImperativeError} CICS CSD group not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */

export function installUrimap(session: AbstractSession, parms: IURIMapParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS URIMap name", "CICS URIMap name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdGroup, "CICS CSD group", "CICS CSD group name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to install a URIMap with the following parameters:\n%s", JSON.stringify(parms));

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `NAME=${parms.name}`,
    parameter: `CSDGROUP(${parms.csdGroup})`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_DEFINITION_URIMAP, options);

  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "CSDINSTALL",
        },
      },
    },
  };

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}
