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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { getCache, getResource, ICMCIApiResponse, ICMCIResponseResultSummary, IResourceQueryParams, putResource } from "@zowe/cics-for-zowe-sdk";
import { AuthOrder, IProfileLoaded } from "@zowe/imperative";
import { extensions } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSExtensionError } from "../errors/CICSExtensionError";
import { SessionHandler } from "../resources";
import { CICSResourceContainerNode } from "../trees";
import { CICSLogger } from "./CICSLogger";
import { getErrorCode } from "./errorUtils";

interface IReqParams {
  criteria?: string;
  parameter?: string;
  queryParams?: IResourceQueryParams;
}

interface IRunGetPutResourceParams {
  profileName: string;
  resourceName: string;
  regionName?: string;
  cicsPlex?: string;
  params?: IReqParams;
}

interface IRunGetCacheParams {
  profileName: string;
  cacheToken: string;
  startIndex?: number;
  count?: number;
}

interface IRunGetCacheQueryParams {
  nodiscard: boolean;
  summonly: boolean;
}

export async function runGetResource({ profileName, resourceName, regionName, cicsPlex, params }: IRunGetPutResourceParams) {
  CICSLogger.debug(
    buildRequestLoggerString("GET", resourceName, {
      regionName,
      cicsPlex,
      criteria: params?.criteria,
      parameters: params?.parameter,
      ...params?.queryParams,
    })
  );

  const profile = SessionHandler.getInstance().getProfile(profileName);
  const session = SessionHandler.getInstance().getSession(profile);

  try {
    if (!session.ISession?.tokenValue) {
      AuthOrder.makingRequestForToken(session.ISession);
    }
    return await getResource(session, buildResourceParms(resourceName, regionName, cicsPlex, params), buildRequestOptions(), [
      buildUserAgentHeader(),
    ]);
  } catch (error) {
    // Make sure the error is not caused by the ltpa token expiring
    if (getErrorCode(error) != constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession?.tokenValue) {
      throw new CICSExtensionError({ baseError: error, profileName, resourceName: getResourceNameFromCriteria(params?.criteria) });
    }
  }

  CICSLogger.debug("Retrying as validation of the LTPA token failed because the token has expired.");
  const newSession = buildNewSession(profile);
  try {
    return getResource(newSession, buildResourceParms(resourceName, regionName, cicsPlex, params), buildRequestOptions(), [buildUserAgentHeader()]);
  } catch (error) {
    throw new CICSExtensionError({ baseError: error, profileName, resourceName: getResourceNameFromCriteria(params?.criteria) });
  }
}

export async function runGetCache(
  { profileName, cacheToken, startIndex, count }: IRunGetCacheParams,
  { nodiscard, summonly }: IRunGetCacheQueryParams = { nodiscard: true, summonly: false }
) {
  CICSLogger.debug(
    buildRequestLoggerString("GET", "CICSResultCache", {
      cacheToken,
      startIndex,
      count,
      nodiscard,
      summonly,
    })
  );

  const profile = SessionHandler.getInstance().getProfile(profileName);
  const session = SessionHandler.getInstance().getSession(profile);

  try {
    if (!session.ISession?.tokenValue) {
      AuthOrder.makingRequestForToken(session.ISession);
    }
    return await getCache(session, { cacheToken, startIndex, count, nodiscard, summonly }, { failOnNoData: false, useCICSCmciRestError: true }, [
      buildUserAgentHeader(),
    ]);
  } catch (error) {
    // Make sure the error is not caused by the ltpa token expiring
    if (getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
      throw new CICSExtensionError({ baseError: error, profileName });
    }
  }

  CICSLogger.debug("Retrying as validation of the LTPA token failed because the token has expired.");

  const newSession = buildNewSession(profile);
  try {
    return getCache(
      newSession,
      { cacheToken, startIndex, count, nodiscard: true, summonly: false },
      { failOnNoData: false, useCICSCmciRestError: true },
      [buildUserAgentHeader()]
    );
  } catch (error) {
    throw new CICSExtensionError({ baseError: error, profileName });
  }
}

export async function runPutResource({ profileName, resourceName, regionName, cicsPlex, params }: IRunGetPutResourceParams, requestBody: any) {
  CICSLogger.debug(
    buildRequestLoggerString("PUT", resourceName, {
      cicsPlex,
      regionName,
      criteria: params?.criteria,
      parameters: params?.parameter,
      ...params?.queryParams,
    })
  );

  const profile = SessionHandler.getInstance().getProfile(profileName);
  const session = SessionHandler.getInstance().getSession(profile);

  try {
    // First attempt
    if (!session.ISession?.tokenValue) {
      AuthOrder.makingRequestForToken(session.ISession);
    }
    return await putResource(
      session,
      buildResourceParms(resourceName, regionName, cicsPlex, params),
      [buildUserAgentHeader()],
      requestBody,
      buildRequestOptions()
    );
  } catch (error) {
    // Make sure the error is not caused by the ltpa token expiring
    if (getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
      throw new CICSExtensionError({ baseError: error, profileName, resourceName: getResourceNameFromCriteria(params?.criteria) });
    }
  }

  CICSLogger.debug("Retrying as validation of the LTPA token failed because the token has expired.");
  const newSession = buildNewSession(profile);

  try {
    return putResource(
      newSession,
      buildResourceParms(resourceName, regionName, cicsPlex, params),
      [buildUserAgentHeader()],
      requestBody,
      buildRequestOptions()
    );
  } catch (error) {
    throw new CICSExtensionError({ baseError: error, profileName, resourceName: getResourceNameFromCriteria(params?.criteria) });
  }
}

export const buildResourceParms = (resourceName: string, regionName: string, cicsplexName: string, params: IReqParams) => {
  return {
    name: resourceName,
    ...(regionName && { regionName }),
    ...(cicsplexName && { cicsPlex: cicsplexName }),
    ...(params?.criteria && { criteria: params.criteria }),
    ...(params?.parameter && { parameter: params.parameter }),
    ...(params?.queryParams && { queryParams: params.queryParams }),
  };
};

export const buildRequestOptions = () => {
  return {
    failOnNoData: false,
    useCICSCmciRestError: true,
  };
};

export const buildNewSession = (profile: IProfileLoaded) => {
  SessionHandler.getInstance().removeSession(profile.name);
  const newSession = SessionHandler.getInstance().getSession(profile);
  AuthOrder.makingRequestForToken(newSession.ISession);

  return newSession;
};

export const buildRequestLoggerString = (
  method: "GET" | "PUT" | "POST",
  resourceName: string,
  opts: { [key: string]: string | boolean | number } = {}
): string => {
  let output = `${method.toUpperCase()} - Resource [${resourceName}]`;
  for (const [k, v] of Object.entries(opts)) {
    if (v) {
      output += `, ${k.toUpperCase()} [${v}]`;
    }
  }
  return output;
};

export async function pollForCompleteAction<T extends IResource>(
  node: CICSResourceContainerNode<T>,
  isCompletionCriteriaMet: (response: { resultsummary: ICMCIResponseResultSummary; records: any }) => boolean,
  criteriaMetCallback: (response: ICMCIApiResponse) => void,
  parentResource?: IResource
) {
  const DELAY_MS = 1000;
  let response: ICMCIApiResponse;
  const containerResource = node.getContainedResource();
  for (let i = 0; i < constants.POLL_FOR_ACTION_DEFAULT_RETRIES; i++) {
    response = await runGetResource({
      profileName: node.getProfile().name,
      resourceName: containerResource.meta.resourceName,
      cicsPlex: node.cicsplexName,
      regionName: node.regionName,
      params: {
        queryParams: {
          summonly: false,
          nodiscard: false,
        },
        criteria: containerResource.meta.buildCriteria([containerResource.meta.getName(containerResource.resource)], parentResource),
      },
    });
    if (isCompletionCriteriaMet(response.response)) {
      break;
    }
    await new Promise((f) => setTimeout(f, DELAY_MS));
  }

  criteriaMetCallback(response);
}

export function buildUserAgentHeader(): { "User-Agent": string } {
  const zeId = `zowe.vscode-extension-for-zowe`;
  const cicsExtId = `zowe.cics-extension-for-zowe`;

  const zeVersion = extensions.getExtension(zeId)?.packageJSON.version;
  const cicsExtVersion = extensions.getExtension(cicsExtId)?.packageJSON.version;

  const agentValue = `${cicsExtId}/${cicsExtVersion} ${zeId}/${zeVersion}`;

  return { "User-Agent": agentValue };
}

function getResourceNameFromCriteria(criteria: string) {
  if (criteria) {
    const resourceNames = criteria
      .split("OR")
      .map((part) => part.split("=")[1]?.trim())
      .filter(Boolean)
      .join(", ");
    return resourceNames;
  }
}
