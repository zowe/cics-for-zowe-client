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

import { notifyErrorMessage } from "./CICSExtensionError";
import { IError } from "./IError";
import errorConstants from "../constants/CICS.errorMessages";
import { CicsCmciRestError } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { ProfileManagement } from "../utils/profileManagement";

export function resourceNotFoundError(error?: IError) {
  if (!error) {
    error.errorMessage = errorConstants.NO_CICS_RESOURCE_SELECTED;
  }
}

export function handleExtensionError() {}

export class CICSErrorHandler {
  // static userUnAuthorizedError(error?: IError) {
  //   throw new CICSExtensionError(error);
  // }

  static handleCMCIRestError(error: any) {
    const err = this.formatErrorMessage(error, error.additionalInfo);
    if (err) {
      notifyErrorMessage({ errorMessage: err });
    } else {
      notifyErrorMessage(error as IError);
    }
  }

  static formatErrorMessage(error: any, identifier?: string) {
    if (identifier) {
      switch (identifier) {
        case "noneProvided":
          if (error instanceof CicsCmciRestError) {
            return `${error.RESPONSE_1_ALT} ${error.RESPONSE_2_ALT} requesting CICSRegion.`;
          } else if (error instanceof imperative.RestClientError) {
            return ProfileManagement.formatRestClientError(error);
          } else {
            const err: Error = error;
            return err.message;
          }
      }
    }
  }
}
