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
import { CicsCmciConstants } from "../constants";
import type { ICMCIApiResponse, ILocalFileParms } from "../doc";
import { performAction } from "../utils/ResourceActions";

/**
 * Close a local file in CICS
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {ILocalFileParms} parms - parameters for closing the local file
 * @param {string} parms.name - the name of the local file to close (1-8 characters)
 * @param {string} parms.regionName - the CICS region name
 * @param {string} [parms.cicsPlex] - the CICSPlex name (optional)
 * @param {string} [parms.busy] - busy condition option: "WAIT", "NOWAIT", or "FORCE" (case-insensitive, optional, default: "WAIT")
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response
 * @throws {ImperativeError} CICS local file name not defined, blank, or exceeds maximum length
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} Invalid BUSY parameter value
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function closeLocalFile(session: AbstractSession, parms: ILocalFileParms): Promise<ICMCIApiResponse> {
  // Validate required parameters
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Local File name", "CICS local file name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  // Validate file name length (CICS resource names are limited to 8 characters)
  if (parms.name.length > CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH) {
    throw new ImperativeError({
      msg: `CICS local file name "${parms.name}" exceeds maximum length of ${CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH} characters`,
    });
  }

  Logger.getAppLogger().debug(
    `Attempting to close a local file with the following parameters:\n%s`,
    JSON.stringify(parms)
  );

  // Get busy parameter value
  const busyValue = parms.busy ? parms.busy.trim().toUpperCase() : "WAIT";

  // Validate busy parameter
  if (!CicsCmciConstants.CICS_LOCAL_FILE_BUSY_VALUES.includes(busyValue)) {
    const allowedValuesStr = CicsCmciConstants.CICS_LOCAL_FILE_BUSY_VALUES.join(", ");
    throw new ImperativeError({
      msg: `Invalid BUSY parameter value: "${busyValue}". Must be one of: ${allowedValuesStr}`,
    });
  }

  // Use generic performAction utility
  return performAction(
    session,
    CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
    "CLOSE",
    {
      name: parms.name,
      regionName: parms.regionName,
      cicsPlex: parms.cicsPlex,
    },
    CicsCmciConstants.CICS_LOCAL_FILE_CRITERIA_FIELD,
    { name: "BUSY", value: busyValue }
  );
}

/**
 * Open a local file in CICS
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {ILocalFileParms} parms - parameters for opening the local file
 * @param {string} parms.name - the name of the local file to open (1-8 characters)
 * @param {string} parms.regionName - the CICS region name
 * @param {string} [parms.cicsPlex] - the CICSPlex name (optional)
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response
 * @throws {ImperativeError} CICS local file name not defined, blank, or exceeds maximum length
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function openLocalFile(session: AbstractSession, parms: ILocalFileParms): Promise<ICMCIApiResponse> {
  // Validate required parameters
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Local File name", "CICS local file name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  // Validate file name length (CICS resource names are limited to 8 characters)
  if (parms.name.length > CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH) {
    throw new ImperativeError({
      msg: `CICS local file name "${parms.name}" exceeds maximum length of ${CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH} characters`,
    });
  }

  Logger.getAppLogger().debug(
    `Attempting to open a local file with the following parameters:\n%s`,
    JSON.stringify(parms)
  );

  // Use generic performAction utility (no additional parameters needed for OPEN)
  return performAction(
    session,
    CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
    "OPEN",
    {
      name: parms.name,
      regionName: parms.regionName,
      cicsPlex: parms.cicsPlex,
    },
    CicsCmciConstants.CICS_LOCAL_FILE_CRITERIA_FIELD
  );
}

/**
 * Enable a local file in CICS
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {ILocalFileParms} parms - parameters for enabling the local file
 * @param {string} parms.name - the name of the local file to enable (1-8 characters)
 * @param {string} parms.regionName - the CICS region name
 * @param {string} [parms.cicsPlex] - the CICSPlex name (optional)
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response
 * @throws {ImperativeError} CICS local file name not defined, blank, or exceeds maximum length
 * @throws {ImperativeError} CICS region name not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export async function enableLocalFile(session: AbstractSession, parms: ILocalFileParms): Promise<ICMCIApiResponse> {
  // Validate required parameters
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Local File name", "CICS local file name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  // Validate file name length (CICS resource names are limited to 8 characters)
  if (parms.name.length > CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH) {
    throw new ImperativeError({
      msg: `CICS local file name "${parms.name}" exceeds maximum length of ${CicsCmciConstants.CICS_LOCAL_FILE_MAX_LENGTH} characters`,
    });
  }

  Logger.getAppLogger().debug(
    `Attempting to enable a local file with the following parameters:\n%s`,
    JSON.stringify(parms)
  );

  // Use generic performAction utility (no additional parameters needed for ENABLE)
  return performAction(
    session,
    CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
    "ENABLE",
    {
      name: parms.name,
      regionName: parms.regionName,
      cicsPlex: parms.cicsPlex,
    },
    CicsCmciConstants.CICS_LOCAL_FILE_CRITERIA_FIELD
  );
}

/**
 * Disable a local file in CICS (future implementation)
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {ILocalFileParms} parms - parameters for disabling the local file
 * @returns {Promise<ICMCIApiResponse>} promise that resolves to the response
 * @throws {ImperativeError} Feature not yet implemented
 */
export async function disableLocalFile(session: AbstractSession, parms: ILocalFileParms): Promise<ICMCIApiResponse> {
  throw new ImperativeError({
    msg: "DISABLE action not yet implemented. This feature requires SDK support for disabling local files.",
  });
}


