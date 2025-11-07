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

import { ICICSExtensionError } from "./ICICSExtensionError";
import { imperative } from "@zowe/zowe-explorer-api";
import { CicsCmciRestError } from "@zowe/cics-for-zowe-sdk";
import constants from "../constants/CICS.defaults";

export class CICSExtensionError extends Error {
  cicsExtensionError: ICICSExtensionError;
  constructor(error?: any) {
    super();
    this.cicsExtensionError = error;
    this.parseError(this.cicsExtensionError.baseError);
  }
  CMCI_REST_API_FAILED = "The CMCI REST API request failed. ";
  parseError(error: any) {
    if (error instanceof CicsCmciRestError) {
      const resultSummary = error.resultSummary;
      const api_function = resultSummary.api_function;
      const feedback = error.errors?.feedback;
      this.cicsExtensionError.resp1Code = parseInt(resultSummary.api_response1);
      this.cicsExtensionError.resp2Code = parseInt(resultSummary.api_response2);

      if (feedback) {
        this.cicsExtensionError.errorMessage = `${this.CMCI_REST_API_FAILED}
        Failed to ${feedback.action} ${feedback.eibfn_alt.replace("SET", "")} 
        resource with API_FUNCTION: ${api_function},  RESP: ${feedback.resp} (${feedback.resp_alt}) and RESP2: ${feedback.resp2}. 
        Please refer to the IBM documentation for resp code details`;
      } else {
        this.cicsExtensionError.errorMessage =
          `The CMCI REST API request failed. ` +
          `Response details: API_FUNCTION: ${api_function},  ` +
          `RESP1: ${resultSummary.api_response1} (${resultSummary.api_response1_alt}), ` +
          `RESP2: ${resultSummary.api_response2} (${resultSummary.api_response2_alt}). ` +
          `Please refer to the IBM documentation for resp code details`;
      }
    } else if (error instanceof imperative.RestClientError) {
      const errorCode = error.mDetails.errorCode || error.errorCode || `${constants.HTTP_ERROR_NOT_FOUND}`;
      const resource = error.mDetails.resource;
      const msg = error.mDetails.msg;
      this.cicsExtensionError.statusCode = parseInt(errorCode);
      this.cicsExtensionError.errorMessage = `${this.CMCI_REST_API_FAILED} 
      Response details: Status code: ${errorCode}, URL: ${resource}, Message: ${msg}`;
      this.cicsExtensionError.baseError = error;
    } else if (error instanceof CICSExtensionError) {
      this.cicsExtensionError.errorMessage = error.cicsExtensionError.errorMessage;
      this.cicsExtensionError.statusCode = error.cicsExtensionError.statusCode;
      this.cicsExtensionError.resp1Code = error.cicsExtensionError.resp1Code;
      this.cicsExtensionError.resp2Code = error.cicsExtensionError.resp2Code;
    } else {
      const err = error as Error;
      this.cicsExtensionError.errorMessage = `${this.CMCI_REST_API_FAILED} ` + `Error message: ${err.message}, ` + `Cause: ${err.cause}`;
    }
  }
}


