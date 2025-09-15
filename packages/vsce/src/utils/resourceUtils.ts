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
  ICMCIResponseResultSummary,
  IGetResourceUriOptions,
  IResourceQueryParams,
  Utils
} from "@zowe/cics-for-zowe-sdk";
import { Session } from "@zowe/imperative";
import constants from "../constants/CICS.defaults";
import { getErrorCode } from "./errorUtils";
import { CICSLogger } from "./CICSLogger";
import { CICSResourceContainerNode } from "../trees";
import { IResource } from "../doc";
import { extensions } from "vscode";

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

  CICSLogger.debug("GET request - Resource [" + resourceName + "]" +
    (cicsPlex ? ", CICSplex [" + cicsPlex + "]" : "") +
    (regionName ? ", Region [" + regionName + "]" : "") +
    (params?.criteria ? ", Criteria [" + params?.criteria + "]" : "") +
    (params?.parameter ? ", Parameter [" + params?.parameter + "]" : "") );

  const requestOptions = {
    failOnNoData: false,
    useCICSCmciRestError: true,
  };

  try {
    // First attempt
    return await getResource(
      session,
      resourceParams,
      requestOptions,
      [buildUserAgentHeader()]
    );
  } catch (error) {
    // Make sure the error is not caused by the ltpa token expiring
    if (getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
      throw error;
    }
  }

  // Making a second attempt as ltpa token has expired
  CICSLogger.debug("Retrying as validation of the LTPA token failed because the token has expired.");
  session.ISession.tokenValue = null;
  return getResource(
    session,
    resourceParams,
    requestOptions,
    [buildUserAgentHeader()]
  );
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

  CICSLogger.debug("PUT request - Resource [" + resourceName + "]" +
    (cicsPlex ? ", CICSplex [" + cicsPlex + "]" : "") +
    (regionName ? ", Region [" + regionName + "]" : "") +
    (params?.criteria ? ", Criteria [" + params?.criteria + "]" : "") +
    (params?.parameter ? ", Parameter [" + params?.parameter + "]" : "") );

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
  CICSLogger.debug("Retrying as validation of the LTPA token failed because the token has expired.");
  session.ISession.tokenValue = null;
  return await CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
}

export async function pollForCompleteAction<T extends IResource>(
  node: CICSResourceContainerNode<T>,
  completionMet: (
    response: {
      resultsummary: ICMCIResponseResultSummary;
      records: any;
    }) => boolean,
  cb: () => void,
  retries: number = constants.POLL_FOR_ACTION_DEFAULT_RETRIES
) {
  for (let i = 0; i < retries; i++) {
    const { response } = await runGetResource({
      session: node.getSession(),
      resourceName: node.getContainedResource().meta.resourceName,
      cicsPlex: node.cicsplexName,
      regionName: node.regionName,
      params: {
        criteria: node.getContainedResource().meta.buildCriteria([
          node.getContainedResource().meta.getName(node.getContainedResource().resource)
        ]),
      },
    });
    if (completionMet(response)) {
      break;
    }
    await new Promise((f) => setTimeout(f, 1000));
  }

  cb();
}

export function buildUserAgentHeader(): { "User-Agent": string; } {
  const zeId = `zowe.vscode-extension-for-zowe`;
  const cicsExtId = `zowe.cics-extension-for-zowe`;

  const zeVersion = extensions.getExtension(zeId)?.packageJSON.version;
  const cicsExtVersion = extensions.getExtension(cicsExtId)?.packageJSON.version;

  const agentValue = `${cicsExtId}/${cicsExtVersion} ${zeId}/${zeVersion}`;

  return { "User-Agent": agentValue };
}
