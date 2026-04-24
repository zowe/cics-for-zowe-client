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

import { type AbstractSession, ImperativeError, ImperativeExpect, Logger } from "@zowe/imperative";
import { CicsCmciConstants } from "../../constants";
import type { ICMCIApiResponse, IGetResourceUriOptions, ILocalFileParms } from "../../doc";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

/**
 * Close a local file in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {ILocalFileParms} parms - parameters for closing your local file
 * @param {string} parms.name - the name of the local file to close (1-8 characters)
 * @param {string} parms.regionName - the CICS region name
 * @param {string} [parms.cicsPlex] - the CICSPlex name (optional)
 * @param {string} [parms.busy] - busy condition option: "WAIT", "NOWAIT", or "FORCE" (case-insensitive, optional)
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS local file name not defined, blank, or exceeds maximum length
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} Invalid BUSY parameter value
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function closeLocalFile(session: AbstractSession, parms: ILocalFileParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Local File name", "CICS local file name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  // Validate file name length (CICS resource names are limited to 8 characters)
  if (parms.name.length > CicsCmciConstants.CICS_RESOURCE_NAME_MAX_LENGTH) {
    throw new ImperativeError({
      msg: `CICS local file name "${parms.name}" exceeds maximum length of ${CicsCmciConstants.CICS_RESOURCE_NAME_MAX_LENGTH} characters`,
    });
  }

  // Set default BUSY value if not provided
  const busyValue = parms.busy && parms.busy.trim() ? parms.busy.trim() : "WAIT";
  
  // Validate BUSY parameter
  const busyUpper = busyValue.toUpperCase();
  if (!CicsCmciConstants.CICS_LOCAL_FILE_BUSY_VALUES.includes(busyUpper as any)) {
    throw new ImperativeError({
      msg: `Invalid BUSY parameter value: "${busyValue}". Must be one of: ${CicsCmciConstants.CICS_LOCAL_FILE_BUSY_VALUES.join(", ")}`,
    });
  }

  Logger.getAppLogger().debug("Attempting to close a local file with the following parameters:\n%s", JSON.stringify(parms));

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `${CicsCmciConstants.CICS_LOCAL_FILE_CRITERIA_FIELD}=${parms.name}`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_CMCI_LOCAL_FILE, options);

  const requestBody: any = {
    request: {
      action: {
        $: {
          name: "CLOSE",
        },
      },
    },
  };

  // BUSY parameter is required by CMCI. Default to WAIT if not provided.
  requestBody.request.action.parameter = {
    $: {
      name: "BUSY",
      value: busyUpper,
    },
  };

  return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}

