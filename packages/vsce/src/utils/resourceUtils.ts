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

import { CicsCmciRestClient, getResource, IGetResourceUriOptions, IResourceQueryParams, Utils } from "@zowe/cics-for-zowe-sdk";
import { Session } from "@zowe/imperative";
import constants from "./constants";
import { getErrorCode } from "./errorUtils";

export async function runGetResource({
  session,
  resourceName,
  regionName,
  cicsPlex,
  params,
}: {
  session: Session;
  resourceName: string;
  regionName?: string;
  cicsPlex?: string;
  params?: { criteria?: string; parameter?: string; queryParams?: IResourceQueryParams };
}) {
  const resourceParams = {
    name: resourceName,
    ...(regionName && { regionName: regionName }),
    ...(cicsPlex && { cicsPlex: cicsPlex }),
    ...(params?.criteria && { criteria: params.criteria }),
    ...(params?.parameter && { parameter: params.parameter }),
    ...(params?.queryParams && { queryParams: params.queryParams }),
  };
  const requestOptions = {
    failOnNoData: false,
    useCICSCmciRestError: true,
  };

  try {
    // First attempt
    return await getResource(session, resourceParams, requestOptions);
  } catch (error) {
    // Make sure the error is not caused by the ltpa token expiring
    if (getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
      throw error;
    }
  }

  // Making a second attempt as ltpa token has expired
  session.ISession.tokenValue = null;
  return await getResource(session, resourceParams, requestOptions);
}

export async function runPutResource(
  {
    session,
    resourceName,
    regionName,
    cicsPlex,
    params,
  }: {
    session: Session;
    resourceName: string;
    regionName?: string;
    cicsPlex?: string;
    params?: { criteria?: string; parameter?: string; queryParams?: IResourceQueryParams };
  },
  requestBody: any
) {
  const options: IGetResourceUriOptions = {
    cicsPlex: cicsPlex,
    regionName: regionName,
    ...params,
  };
  const cmciResource = Utils.getResourceUri(resourceName, options);

  try {
    // First attempt
    return await CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
  } catch (error) {
    // Make sure the error is not caused by the ltpa token expiring
    if (getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
      throw error;
    }
  }

  // Making a second attempt as ltpa token has expired
  session.ISession.tokenValue = null;
  return await CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}
