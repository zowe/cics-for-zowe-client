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
  getCache,
  getResource,
  ICMCIApiResponse,
  ICMCIRequestOptions,
  IResourceParms,
  IResourceQueryParams,
  Utils
} from "@zowe/cics-for-zowe-sdk";
import { CICSSession } from "../resources";
import constants from "../utils/constants";


class SCICSRequester {
  private static _instance: SCICSRequester;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  requestOptions: ICMCIRequestOptions = {
    failOnNoData: false,
    useCICSCmciRestError: true,
  };

  getErrorCode(error: any) {
    return error.mDetails?.errorCode || error.response?.status;
  }

  async get(
    session: CICSSession,
    params: {
      resourceName: string;
      regionName?: string;
      cicsplexName?: string;
      criteria?: string;
      parameter?: string;
      queryParams?: IResourceQueryParams;
    }
  ): Promise<ICMCIApiResponse> {
    const resourceParams: IResourceParms = {
      name: params.resourceName,
      ...(params.regionName && { regionName: params.regionName }),
      ...(params.cicsplexName && { cicsPlex: params.cicsplexName }),
      ...(params.criteria && { criteria: params.criteria }),
      ...(params.parameter && { parameter: params.parameter }),
      ...(params.queryParams && { queryParams: params.queryParams }),
    };

    try {
      return getResource(session, resourceParams, this.requestOptions);
    } catch (error) {
      if (this.getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
        throw error;
      }
    }

    session.ISession.tokenValue = null;
    return getResource(session, resourceParams, this.requestOptions);
  }

  async put(
    session: CICSSession,
    resourceName: string,
    params: {
      cicsplexName?: string;
      regionName?: string;
      criteria?: string;
      parameter?: string;
      queryParams?: IResourceQueryParams;
    },
    requestBody: any
  ): Promise<ICMCIApiResponse> {

    const cmciResource = Utils.getResourceUri(resourceName, params);

    try {
      return await CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
    } catch (error) {
      if (this.getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
        throw error;
      }
    }

    session.ISession.tokenValue = null;
    return CicsCmciRestClient.putExpectParsedXml(session, cmciResource, [], requestBody);
  }

  getCache(session: CICSSession, { cacheToken }: { cacheToken: string; }) {

    try {
      return getCache(session, { cacheToken }, this.requestOptions);
    } catch (error) {
      if (this.getErrorCode(error) !== constants.HTTP_ERROR_UNAUTHORIZED || !session.ISession.tokenValue) {
        throw error;
      }
    }

    session.ISession.tokenValue = null;
    return getCache(session, { cacheToken }, this.requestOptions);
  }

}

const CICSRequester = SCICSRequester.Instance;
export default CICSRequester;