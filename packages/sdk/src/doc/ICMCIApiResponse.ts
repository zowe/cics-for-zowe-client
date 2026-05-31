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

/**
 * Interface representing API response from CMCI's web interface, parsed from XML to a javascript object
 * using the xml2js package.
 */
import type { ICMCIResponseErrors } from "./ICMCIResponseErrors";
import type { ICMCIResponseResultSummary } from "./ICMCIResponseResultSummary";

export interface ICMCIApiResponse {
  /**
   * See the following link for more information:
   * https://www.ibm.com/support/knowledgecenter/SSGMCP_5.2.0/com.ibm.cics.ts.clientapi.doc/topics/clientapi_response_element.html
   */
  response: {
    /**
     * See the following link for more information:
     * https://www.ibm.com/support/knowledgecenter/SSGMCP_5.2.0/com.ibm.cics.ts.clientapi.doc/topics/clientapi_resultsummary_element.html
     */
    resultsummary: ICMCIResponseResultSummary;
    /**
     * See the following link for more information:
     * https://www.ibm.com/support/knowledgecenter/SSGMCP_5.2.0/com.ibm.cics.ts.clientapi.doc/topics/clientapi_records_element.html
     */
    records: any;
    /**
     * See the following link for more information:
     * https://www.ibm.com/support/knowledgecenter/SSGMCP_5.2.0/com.ibm.cics.ts.clientapi.doc/topics/clientapi_errors_element.html
     */
    errors?: ICMCIResponseErrors;
  };
  /**
   * Flag indicating that records were returned despite an error response code.
   * When true, the response contains partial results (e.g., partial authorization,
   * CMAS down, etc.) and consumers should display a warning to the user.
   *
   * This flag is set by the SDK and is not part of the CMCI API response.
   */
  incompleteResults?: boolean;
  /**
   * Detailed error message describing the partial results condition.
   * This message includes the CMCI error codes and descriptions.
   *
   * This field is set by the SDK and is not part of the CMCI API response.
   */
  incompleteResultsMessage?: string;
}
