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

import { CICSExtensionError } from "./CICSExtensionError";
import { IError } from "./IError";
import errorConstants from "../constants/CICS.errorMessages";

const cicsExtensionError: CICSExtensionError = new CICSExtensionError();

export function userUnAuthorizedError(error?: IError) {
  cicsExtensionError.notifyErrorMessage(error);
}

export function resourceNotFoundError(error?: IError) {
  if (!error) {
    error.errorMessage = errorConstants.NO_CICS_RESOURCE_SELECTED;
  }
}
