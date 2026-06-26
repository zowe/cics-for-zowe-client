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

import type { ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { getMetas } from "../doc";
import { URLConstants } from "../errors/urlConstants";

export function getErrorCode(error: any) {
  return error.mDetails?.errorCode || error.response?.status;
}

export function getHelpTopicNameFromMetas(resourceType: string): { docFile: string; anchor: string } | undefined {
  if (resourceType === URLConstants.GET_RESOURCE) {
    return { docFile: URLConstants.GET_COMMAND_DOC_FILE, anchor: URLConstants.GET_COMMAND_URI_FRAGMENT };
  }
  const result = getResourceTypeAndHelpTopic(resourceType);
  if (!result || !result.docFile) {
    return undefined;
  }
  return { docFile: result.docFile, anchor: result.anchor };
}

export function getEIBFNameFromMetas(eibfnAlt: string): string | undefined {
  return getResourceTypeAndHelpTopic(eibfnAlt)?.eibfnName;
}

function getResourceTypeAndHelpTopic(resourceType: string): { eibfnName: string; docFile: string; anchor: string } | undefined {
  if (!resourceType) {
    return undefined;
  }

  const meta = getMetas().find((m) => m.eibfnName && resourceType.trim().toLowerCase().includes(m.eibfnName.toLowerCase()));

  if (!meta) {
    return undefined;
  }

  return {
    eibfnName: meta.eibfnName,
    docFile: meta.setCommandDocFile,
    anchor: meta.anchorFragmentForSet,
  };
}


/**
 * Helper function to check if a records object contains any actual records
 * @param records - The records object to check
 * @returns true if records exist and contain data, false otherwise
 */
export function hasRecordsWithData(records: any): boolean {
  if (!records || typeof records !== 'object') {
    return false;
  }
  return Object.keys(records).length > 0 &&
    Object.values(records).some((recordArray) => Array.isArray(recordArray) && recordArray.length > 0);
}

/**
 * Only converts if the error has both resultSummary and non-empty incomplete records.
 * @param error - The error object (CicsCmciRestError). Returns null if error is null/undefined.
 * @returns ICMCIApiResponse with incomplete records, or null if error doesn't have incomplete records
 */
export function convertErrorToIncompleteResponse(error: any): ICMCIApiResponse | null {
  // Check for valid error with resultSummary and non-empty records
  if (!error?.resultSummary || !error?.records) {
    return null;
  }
  
  // Validate that records actually contains data
  if (!hasRecordsWithData(error.records)) {
    return null;
  }
  
  return {
    response: {
      resultsummary: error.resultSummary,
      records: error.records,
      errors: error.errors
    }
  };
}


