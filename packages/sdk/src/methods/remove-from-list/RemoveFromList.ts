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
import { ICMCIApiResponse, ICSDGroupParms, IGetResourceUriOptions } from "../../doc";
import { CicsCmciRestClient } from "../../rest";
import { Utils } from "../../utils";

/**
 * Remove a CSD Group resource from a CSD List in CICS through CMCI REST API
 * @param {AbstractSession} session - the session to connect to CMCI with
 * @param {ICSDGroupParms} parms - parameters for defining your CSD Group
 * @returns {Promise<any>} promise that resolves to the response (XML parsed into a javascript object)
 *                          when the request is complete
 * @throws {ImperativeError} CICS CSD Group name not defined or blank
 * @throws {ImperativeError} CICS CSD List not defined or blank
 * @throws {ImperativeError} CicsCmciRestClient request fails
 */
export function removeCSDGroupFromList(session: AbstractSession, parms: ICSDGroupParms): Promise<ICMCIApiResponse> {
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS CSD Group Name", "CICS CSD Group Name is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.csdList, "CICS CSD List", "CICS CSD List is required");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name", "CICS region name is required");

  Logger.getAppLogger().debug("Attempting to remove a CSD Group from a CSD List with the following parameters:\n%s", JSON.stringify(parms));

  const options: IGetResourceUriOptions = {
    cicsPlex: parms.cicsPlex,
    regionName: parms.regionName,
    criteria: `(CSDLIST=='${parms.csdList}') AND (CSDGROUP=='${parms.name}')`,
  };

  const cmciResource = Utils.getResourceUri(CicsCmciConstants.CICS_CSDGROUP_IN_LIST, options);

  return CicsCmciRestClient.deleteExpectParsedXml(session, cmciResource, []) as any;
}
