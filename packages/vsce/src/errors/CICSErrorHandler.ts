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

import { CicsCmciConstants, type ICMCIApiResponse, type ICMCIResponseResultSummary } from "@zowe/cics-for-zowe-sdk";
import { Gui } from "@zowe/zowe-explorer-api";
import { l10n, MarkdownString, window, type MessageItem } from "vscode";
import { CICSLogger } from "../utils/CICSLogger";
import { hasRecordsWithData } from "../utils/errorUtils";
import { generateDocumentationURL } from "../utils/urlUtils";
import { CICSExtensionError } from "./CICSExtensionError";


export class CICSErrorHandler {
  static handleCMCIRestError(error: CICSExtensionError, action?: MessageItem[]): Thenable<string | MessageItem> {
    const { errorMessage: msg, resourceType, stackTrace } = error.cicsExtensionError;

    let message = msg;
    if (resourceType && !action && msg) {
      const docUrl = generateDocumentationURL(resourceType.trim().toLowerCase())?.toString();
      if (docUrl) {
        message = l10n.t("{0} Please refer to the [IBM documentation]({1}) for additional details", msg, docUrl);
      }
    }

    return this.notifyErrorMessage({ errorMessage: message, additionalInfo: stackTrace, action });
  }

  /**
   * Format a message with IBM documentation link
   * @param message - The message to format
   * @param resourceType - The resource type to generate documentation URL for
   * @returns Formatted message with documentation link
   */
  static formatMessageWithDocLink(message: string, resourceType: string): string {
    const docUrl = generateDocumentationURL(resourceType.trim().toLowerCase())?.toString();
    if (docUrl) {
      return l10n.t("{0} Please refer to the [IBM documentation]({1}) for additional details", message, docUrl);
    }
    return message;
  }

  /**
   * Handle errors in API responses by displaying an error message with documentation link
   * @param apiResponse - The API response or result summary that may contain an error
   * @param resourceType - The resource type for documentation URL generation (default: CicsCmciConstants.DOC_RESOURCE_TYPE_GET)
   * @param profileName - Optional profile name to include in the error message
   * @returns true if an error was handled, false otherwise
   */
  static handleErrorIfPresent(
    apiResponse: ICMCIApiResponse | ICMCIResponseResultSummary | null | undefined,
    resourceType: string = CicsCmciConstants.DOC_RESOURCE_TYPE_GET,
    profileName?: string
  ): boolean {
    if (!apiResponse) {
      return false;
    }

    // Handle full API response
    if ('response' in apiResponse) {
      return this.handleApiResponseError(apiResponse, resourceType, profileName);
    }
    
    // Handle result summary directly
    if ('api_response1' in apiResponse) {
      return this.handleResultSummaryError(apiResponse as ICMCIResponseResultSummary, resourceType, profileName);
    }
    
    return false;
  }

  /**
   * Handle errors in full API responses
   * @param apiResponse - The full API response
   * @param resourceType - The resource type for documentation URL generation
   * @param profileName - Optional profile name to include in the error message
   * @returns true if an error was handled, false otherwise
   */
  private static handleApiResponseError(
    apiResponse: ICMCIApiResponse,
    resourceType: string,
    profileName?: string
  ): boolean {
    const { resultsummary, records } = apiResponse.response;
    
    if (!resultsummary) {
      return false;
    }

    // Check if response code is not OK but we have records (error with partial results)
    const isNotOk = resultsummary.api_response1 !== String(CicsCmciConstants.RESPONSE_1_CODES.OK);
    const hasRecords = hasRecordsWithData(records);
    
    if (isNotOk && hasRecords) {
      this.showErrorWithDocLink(resultsummary, resourceType, profileName);
      return true;
    }
    
    return false;
  }

  /**
   * Handle errors in result summary responses
   * @param resultsummary - The result summary
   * @param resourceType - The resource type for documentation URL generation
   * @param profileName - Optional profile name to include in the error message
   * @returns true if an error was handled, false otherwise
   */
  private static handleResultSummaryError(
    resultsummary: ICMCIResponseResultSummary,
    resourceType: string,
    profileName?: string
  ): boolean {
    const isNotOk = resultsummary.api_response1 !== String(CicsCmciConstants.RESPONSE_1_CODES.OK);
    const hasRecords = resultsummary.recordcount !== undefined && parseInt(resultsummary.recordcount) > 0;

    if (isNotOk && hasRecords) {
      this.showErrorWithDocLink(resultsummary, resourceType, profileName);
      return true;
    }

    return false;
  }

  /**
   * Show error message with documentation link
   * @param resultsummary - The result summary containing error details
   * @param resourceType - The resource type for documentation URL generation
   * @param profileName - Optional profile name to include in the error message
   */
  private static showErrorWithDocLink(
    resultsummary: ICMCIResponseResultSummary,
    resourceType: string,
    profileName?: string
  ): void {
    const message = CICSExtensionError.formatDetailedErrorMessage(resultsummary, profileName);
    const formattedMessage = this.formatMessageWithDocLink(message, resourceType);
    
    CICSLogger.error(formattedMessage);
    
    window.showErrorMessage(formattedMessage);
  }

  /**
   * Builds a MarkdownString tooltip matching the design:
   *   "Retrieving these resources resulted in an error:"
   * @param resultsummary - The CMCI result summary with resp codes
   * @returns MarkdownString tooltip, or undefined if no error in summary
   */
  static buildIncompleteResultsTooltip(resultsummary: ICMCIResponseResultSummary): MarkdownString | undefined {
    if (!resultsummary || resultsummary.api_response1 === String(CicsCmciConstants.RESPONSE_1_CODES.OK)) {
      return undefined;
    }

    const resp1Alt = resultsummary.api_response1_alt ?? resultsummary.api_response1;
    const resp1 = resultsummary.api_response1;
    const resp2Alt = resultsummary.api_response2_alt ?? resultsummary.api_response2;
    const resp2 = resultsummary.api_response2;

    const docUrl = generateDocumentationURL(CicsCmciConstants.DOC_RESOURCE_TYPE_GET)?.toString();

    const tooltip = new MarkdownString();
    tooltip.isTrusted = true;
    tooltip.appendMarkdown(`${l10n.t("Retrieving these resources resulted in an error:")}\n\n`);
    tooltip.appendMarkdown(`${resp1Alt} (${resp1}) / ${resp2Alt} (${resp2})\n\n`);
    if (docUrl) {
      tooltip.appendMarkdown(`${l10n.t("Visit")} [${l10n.t("IBM docs")}](${docUrl}) ${l10n.t("for resp code details")}`);
    }
    return tooltip;
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
    const logMessage = additionalInfo ? `${this.trimLineBreaks(errorMessage)}\n${additionalInfo}` : this.trimLineBreaks(errorMessage);

    CICSLogger.error(logMessage);

    return Gui.errorMessage(errorMessage, { items: action || [] });
  }

  private static trimLineBreaks(msg: string): string {
    return msg.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  }
}
