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

import { Gui } from "@zowe/zowe-explorer-api";
import { MessageItem } from "vscode";
import errorConstants from "../constants/CICS.errorMessages";
import { CICSLogger } from "../utils/CICSLogger";
import { openDocumentation } from "../utils/urlUtils";
import { CICSExtensionError } from "./CICSExtensionError";
import { ICICSExtensionError } from "./ICICSExtensionError";
import { URLConstants } from "./urlConstants";

export function resourceNotFoundError(error?: ICICSExtensionError) {
  if (!error) {
    error.errorMessage = errorConstants.NO_CICS_RESOURCE_SELECTED;
  }
}

export class CICSErrorHandler {
  static handleCMCIRestError(error: CICSExtensionError, action?: MessageItem[]): Thenable<string | MessageItem> {
    const { errorMessage: msg, resourceType } = error.cicsExtensionError;
    const actions = resourceType && !action ? [URLConstants.OPEN_DOCUMENTATION] : action;
    const result = this.notifyErrorMessage({ errorMessage: msg, action: actions });

    if (resourceType && !action) {
      result.then(async (selection) => {
        if (selection === URLConstants.OPEN_DOCUMENTATION) {
          await openDocumentation(resourceType.trim().toLowerCase());
        }
      });
    }

    return result;
  }

  handleExtensionError() {}

  private static notifyErrorMessage({
    errorMessage,
    additionalInfo,
    action,
  }: {
    errorMessage: string;
    additionalInfo?: string;
    action?: MessageItem[];
  }): Thenable<string | MessageItem> {
    const logMessage = additionalInfo ? `${this.trimLineBreaks(errorMessage)} ${additionalInfo}` : this.trimLineBreaks(errorMessage);

    CICSLogger.error(logMessage);

    return Gui.errorMessage(errorMessage, { items: action || [] });
  }

  private static trimLineBreaks(msg: string): string {
    return msg.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  }
}
