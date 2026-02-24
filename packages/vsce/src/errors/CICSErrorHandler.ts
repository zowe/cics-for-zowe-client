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
import { l10n, type MessageItem } from "vscode";
import { CICSLogger } from "../utils/CICSLogger";
import { generateDocumentationURL } from "../utils/urlUtils";
import type { CICSExtensionError } from "./CICSExtensionError";

export class CICSErrorHandler {
  static handleCMCIRestError(error: CICSExtensionError, action?: MessageItem[]): Thenable<string | MessageItem> {
    const { errorMessage: msg, resourceType } = error.cicsExtensionError;

    let message = msg;
    if (resourceType && !action && msg) {
      const docUrl = generateDocumentationURL(resourceType.trim().toLowerCase())?.toString();
      if (docUrl) {
        message = l10n.t("{0} Please refer to the [IBM documentation]({1}) for additional details", msg, docUrl);
      }
    }

    return this.notifyErrorMessage({ errorMessage: message, action });
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
