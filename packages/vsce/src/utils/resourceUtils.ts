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

import {
  CicsCmciRestClient,
  getResource,
  IGetResourceUriOptions,
  IResourceQueryParams,
  Utils
} from "@zowe/cics-for-zowe-sdk";
import { Session } from "@zowe/imperative";
import constants from "./constants";
import { getErrorCode } from "./errorUtils";

export async function runGetResource({ session, resourceName, regionName, cicsPlex, params }: {
  session: Session,
  resourceName: string,
  regionName?: string,
  cicsPlex?: string,
  params?: { criteria?: string, parameter?: string; queryParams?: IResourceQueryParams; };
}) {
  let count = 0;
  while (count <= 1) {
    try {
      const response = await getResource(session, {
        name: resourceName,
        ...regionName && { regionName: regionName},
        ...cicsPlex && { cicsPlex: cicsPlex },
        ...params?.criteria && { criteria: params.criteria },
        ...params?.parameter && { parameter: params.parameter },
        ...params?.queryParams && { queryParams: params.queryParams },
      },
      { failOnNoData: false, useCICSCmciRestError: true });
      return response;
    } catch (error){
      count++;
      if (count <= 1 &&
        getErrorCode(error) === constants.HTTP_ERROR_UNAUTHORIZED && session.ISession.tokenValue) {
        session.ISession.tokenValue = null;
        continue;
      }
      throw error;
    }
  }
}

export async function runPutResource({ session, resourceName, regionName, cicsPlex, params }: {
  session: Session,
  resourceName: string,
  regionName?: string,
  cicsPlex?: string,
  params?: { criteria?: string, parameter?: string; queryParams?: IResourceQueryParams; };
}, requestBody: any) {
  let count = 0;
  while (count <= 1) {
    try {
      const options: IGetResourceUriOptions = {
        "cicsPlex": cicsPlex,
        "regionName": regionName,
        ...params
      };

      const cmciResource = Utils.getResourceUri(resourceName, options);

      return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
    } catch (error){
      count++;
      if (count <= 1 &&
        getErrorCode(error) === constants.HTTP_ERROR_UNAUTHORIZED && session.ISession.tokenValue) {
        session.ISession.tokenValue = null;
        continue;
      }
      throw error;
    }
  }
}