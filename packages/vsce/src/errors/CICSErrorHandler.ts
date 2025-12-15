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
import { CICSExtensionError } from "./CICSExtensionError";
import { ICICSExtensionError } from "./ICICSExtensionError";
import { openDocumentation } from "../utils/urlUtils";
import { URLConstants } from "./urlConstants";

export function resourceNotFoundError(error?: ICICSExtensionError) {
  if (!error) {
    error.errorMessage = errorConstants.NO_CICS_RESOURCE_SELECTED;
  }
}

export class CICSErrorHandler {
  static handleCMCIRestError(error: CICSExtensionError, action?: MessageItem[]): Thenable<string | MessageItem> {
    const msg = error.cicsExtensionError.errorMessage;
    const resourceType = error.cicsExtensionError.resourceType;
    if (resourceType && !action) {
      CICSErrorHandler.openDoc(resourceType, msg);
      return;
    }
    return this.notifyErrorMessage({ errorMessage: msg, action: action });
  }

  private static openDoc(resourceType: string, msg: string) {
    this.notifyErrorMessage({ errorMessage: msg, action: [URLConstants.OPEN_DOCUMENTATION] }).then(async (selection) => {
      if (selection === URLConstants.OPEN_DOCUMENTATION) {
        await openDocumentation(resourceType.trim().toLowerCase());
      }
    });
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
    CICSLogger.error(`${this.trimLineBreaks(errorMessage)} ${additionalInfo ?? ""}`.trim());

    return Gui.errorMessage(errorMessage, { items: action ?? [] });
  }

  private static trimLineBreaks(msg: string) {
    return msg.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  }
}
