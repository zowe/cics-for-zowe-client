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
 * Represents the "feedback" field of the CMCI API response, parsed from XML
 * to a javascript object with the xml2js package.
 * See the following link for more information:
 * https://www.ibm.com/support/knowledgecenter/SSGMCP_5.2.0/com.ibm.cics.ts.clientapi.doc/topics/clientapi_feedback_element.html
 * 
 */
export interface ICMCIResponseErrorFeedBack {
  eyu_cicsname?: string
  action?: string 
  eibfn?: string
  eibfn_alt: string
  resp: string
  resp_alt: string
  resp2: string
}
