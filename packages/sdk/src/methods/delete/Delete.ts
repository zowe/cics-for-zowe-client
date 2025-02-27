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
import { ICMCIApiResponse, IGetResourceUriOptions, IProgramParms, ITransactionParms, IURIMapParms, IWebServiceParms } from "../../doc";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

/**
 * Delete a program installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IProgramParms} parms - parameters for deleting your program
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS program name not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function deleteProgram(session: AbstractSession, parms: IProgramParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Program name", "CICS program name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdGroup, "CICS CSD Group", "CICS CSD group is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to delete a program with the following parameters:\n%s", JSON.stringify(parms));

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `NAME=${parms.name}`,
    parameter: `CSDGROUP(${parms.csdGroup})`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_DEFINITION_PROGRAM, options);

  return CicsCmciRestClient.deleteExpectParsedXml(session, cmciResource, []);
}

/**
 * Delete a transaction installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {ITransactionParms} parms - parameters for deleting your transaction
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS transaction name not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function deleteTransaction(session: AbstractSession, parms: ITransactionParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Transaction name", "CICS transaction name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdGroup, "CICS CSD Group", "CICS CSD group is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to delete a transaction with the following parameters:\n%s", JSON.stringify(parms));

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `NAME=${parms.name}`,
    parameter: `CSDGROUP(${parms.csdGroup})`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_DEFINITION_TRANSACTION, options);

  return CicsCmciRestClient.deleteExpectParsedXml(session, cmciResource, []);
}

/**
 * Delete a URIMap installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IURIMapParms} parms - parameters for deleting your URIMap
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS URIMap name not defined or blank
 * @throws {ImperativeError} CICS CSD group not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function deleteUrimap(session: AbstractSession, parms: IURIMapParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS URIMap name", "CICS URIMap name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdGroup, "CICS CSD Group", "CICS CSD group is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to delete a URIMap with the following parameters:\n%s", JSON.stringify(parms));

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `NAME=${parms.name}`,
    parameter: `CSDGROUP(${parms.csdGroup})`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_DEFINITION_URIMAP, options);

  return CicsCmciRestClient.deleteExpectParsedXml(session, cmciResource, []);
}

/**
 * Delete a web service installed in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {IWebServiceParms} parms - parameters for deleting your web service
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS Web service name not defined or blank
 * @throws {ImperativeError} CICS CSD group not defined or blank
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function deleteWebservice(session: AbstractSession, parms: IWebServiceParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Web service name", "CICS Web service name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdGroup, "CICS CSD Group", "CICS CSD group is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to delete a web service with the following parameters:\n%s", JSON.stringify(parms));

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `NAME=${parms.name}`,
    parameter: `CSDGROUP(${parms.csdGroup})`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_DEFINITION_WEBSERVICE, options);

  return CicsCmciRestClient.deleteExpectParsedXml(session, cmciResource, []);
}
