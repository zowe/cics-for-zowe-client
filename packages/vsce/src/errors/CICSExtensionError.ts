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

import { IError } from "./IError";
import { imperative } from "@zowe/zowe-explorer-api";
import { CicsCmciRestError } from "@zowe/cics-for-zowe-sdk";

export class CICSExtensionError extends Error {
  cicsExtensionError: IError;
  constructor(error?: any) {
    super();
    this.cicsExtensionError = error;
    this.parseError(this.cicsExtensionError.baseError);
  }

  parseError(error: any) {
    if (error instanceof CicsCmciRestError) {
      const resultSummary = error.resultSummary;
      const api_function = resultSummary.api_function;
      const feedback = resultSummary.errors?.feedback;
      this.cicsExtensionError.resp1Code = parseInt(resultSummary.api_response1);
      this.cicsExtensionError.resp2Code = parseInt(resultSummary.api_response2);

      if (feedback) {
        this.cicsExtensionError.errorMessage =
          `The CMCI REST API request failed.\n` +
          `Response details:\n` +
          `API_FUNCTION = "${api_function}"\n` +
          `ACTION = "${feedback.action}"\n` +
          `EIBFN = ${feedback.eibfn}\n` +
          `EIBFN_ALT = ${feedback.eibfn_alt}\n` +
          `RESP = ${feedback.resp}\n` +
          `RESP_ALT = ${feedback.resp_alt}\n` +
          `RESP2 = ${feedback.resp2}\n` +
          `Please refer to the IBM documentation for resp code details`;
      } else {
        this.cicsExtensionError.errorMessage =
          `The CMCI REST API request failed.\n` +
          `Response details:\n` +
          `API_FUNCTION = "${api_function}"\n` +
          `RESP1 = "${resultSummary.api_response1}"\n` +
          `RESP1_ALT = ${resultSummary.api_response1_alt}\n` +
          `RESP2 = ${resultSummary.api_response2}\n` +
          `RESP2_ALT = ${resultSummary.api_response2_alt}\n` +
          `Please refer to the IBM documentation for resp code details`;
      }
    } else if (error instanceof imperative.RestClientError) {
      const errorCode = error.mDetails.errorCode || error.errorCode;
      const resource = error.mDetails.resource;
      const msg = error.mDetails.msg;
      this.cicsExtensionError.statusCode = parseInt(errorCode);
      this.cicsExtensionError.errorMessage =
        `The CMCI REST API request failed.Response details:\n` + `Error status code: ${errorCode}\n` + `URL: ${resource}\n Message: ${msg}`;
      this.cicsExtensionError.baseError = error;
    } else if (error instanceof CICSExtensionError) { 
      this.cicsExtensionError.errorMessage = error.cicsExtensionError.errorMessage;
      this.cicsExtensionError.statusCode = error.cicsExtensionError.statusCode;
      this.cicsExtensionError.resp1Code = error.cicsExtensionError.resp1Code;
      this.cicsExtensionError.resp2Code = error.cicsExtensionError.resp2Code;
    } else {
      const err = error as Error;
      this.cicsExtensionError.errorMessage = `The CMCI REST API request failed.\n` + `Error message: ${err.message}` + `Cause:\n ${err.cause}`;
    }
  }
}


