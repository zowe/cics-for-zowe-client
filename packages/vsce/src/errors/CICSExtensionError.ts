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

import { CicsCmciRestError } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { l10n } from "vscode";
import { getEIBFNameFromMetas } from "../utils/errorUtils";
import { ICICSExtensionError } from "./ICICSExtensionError";

export class CICSExtensionError extends Error {
  cicsExtensionError: ICICSExtensionError;
  constructor(error: ICICSExtensionError) {
    super();
    this.cicsExtensionError = error;
    this.parseError();
  }

  parseError() {
    const error = this.cicsExtensionError.baseError;
    const errorMessage = this.cicsExtensionError.errorMessage;
    const resourceName = this.cicsExtensionError.resourceName;
    if (error instanceof CicsCmciRestError) {
      const resultSummary = error.resultSummary;
      const api_function = resultSummary.api_function;
      const feedback = error.errors?.feedback;
      this.cicsExtensionError.resp1Code = parseInt(resultSummary.api_response1);
      this.cicsExtensionError.resp2Code = parseInt(resultSummary.api_response2);

      if (feedback) {
        this.cicsExtensionError.resourceType = getEIBFNameFromMetas(feedback.eibfn_alt);
        this.cicsExtensionError.errorMessage =
          errorMessage ||
          l10n.t(
            "Failed to {0} {1} {2} with API: {3}, RESP: {4} ({5}) and RESP2: {6}.",
            feedback.action,
            this.cicsExtensionError.resourceType,
            resourceName,
            api_function,
            feedback.resp,
            feedback.resp_alt,
            feedback.resp2
          );
      } else {
        //setting resourceType to GET for generating doc url
        this.cicsExtensionError.resourceType = api_function;
        this.cicsExtensionError.errorMessage =
          errorMessage ||
          l10n.t(
            `The request failed` +
              (resourceName ? ` for resources: {0}. ` : `. `) +
              `Response details: API_FUNCTION: {1}, ` +
              `RESP: {2} ({3}), ` +
              `RESP2: {4} ({5}).`,
            resourceName,
            api_function,
            resultSummary.api_response1,
            resultSummary.api_response1_alt,
            resultSummary.api_response2,
            resultSummary.api_response2_alt
          );
      }
    } else if (error instanceof imperative.RestClientError) {
      const errorCode = error.mDetails.errorCode || error.errorCode;
      const resource = error.mDetails.resource;
      const msg = error.mDetails.msg;
      this.cicsExtensionError.statusCode = parseInt(errorCode);
      this.cicsExtensionError.errorMessage =
        errorMessage ||
        l10n.t("Failed to send request. Response details - {0}URL: {1}, Message: {2}", errorCode ? `Status code: ${errorCode}, ` : ``, resource, msg);
      this.cicsExtensionError.baseError = error;
    } else if (error instanceof CICSExtensionError) {
      this.cicsExtensionError.errorMessage = error.cicsExtensionError.errorMessage;
      this.cicsExtensionError.statusCode = error.cicsExtensionError.statusCode;
      this.cicsExtensionError.resp1Code = error.cicsExtensionError.resp1Code;
      this.cicsExtensionError.resp2Code = error.cicsExtensionError.resp2Code;
    } else {
      const err = error as Error;
      this.cicsExtensionError.errorMessage = l10n.t("The request failed. Error message: {0}, Cause: {1}", err.message, `${err.cause}`);
    }
  }
}
