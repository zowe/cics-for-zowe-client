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

import { AbstractSession, IImperativeError, ImperativeError, Logger, RestClient, TextUtils } from "@zowe/imperative";
import { Builder, Parser } from "xml2js";
import { ICMCIApiResponse } from "../doc/ICMCIApiResponse";
import { CicsCmciMessages } from "../constants/CicsCmci.messages";
import { isString } from "util";

/**
 * Wrapper for invoke CICS CMCI API through the RestClient to perform common error
 * handling and checking and resolve promises according to generic types
 * @export
 * @class CicsCmciRestClient
 * @extends {RestClient}
 */
export class CicsCmciRestClient extends RestClient {
  /**
   * If the API request is successful, this value should be in
   * api_response2 in  the resultsummary object in the response
   */
  public static readonly CMCI_SUCCESS_RESPONSE_1 = "1024";

  /**
   * If the API request is successful, this value should be in
   * api_response2 in  the resultsummary object in the response
   */
  public static readonly CMCI_SUCCESS_RESPONSE_2 = "0";

  /**
   * Convert an object to XML using the xml2js package
   * @param obj - the object to convert to XML
   * @returns {string} the string of XML generated by xml2js
   */
  public static convertObjectToXML(obj: any): string {
    this.log.trace("Converting the following object to XML via xml2js:\n%s", JSON.stringify(obj, null, 2));
    const builder = new Builder({ headless: true });
    return builder.buildObject(obj);
  }

  /**
   * Call the RestClient.getExpectString function assuming the response is XML, then return a promise of the JSON representation.
   * @static
   * @param {AbstractSession} session - representing connection to this api
   * @param {string} resource - URI for which this request should go against
   * @param {any} reqHeaders - headers to include in the REST request
   * @returns {Promise<*>} - response body content from http(s) call
   * @throws {ImperativeError} verifyResponseCodes fails
   */
  public static async getExpectParsedXml(session: AbstractSession, resource: string, reqHeaders: any[] = []): Promise<ICMCIApiResponse> {
    const data = await CicsCmciRestClient.getExpectString(session, resource, reqHeaders);
    const apiResponse = CicsCmciRestClient.parseStringSync(data);
    return CicsCmciRestClient.verifyResponseCodes(apiResponse);
  }

  /**
   * Call the RestClient.deleteExpectString function assuming the response is XML, then return a promise of the JSON representation.
   * @static
   * @param {AbstractSession} session - representing connection to this api
   * @param {string} resource - URI for which this request should go against
   * @param {any} reqHeaders - headers to include in the REST request
   * @returns {Promise<*>} - response body content from http(s) call
   * @throws {ImperativeError} verifyResponseCodes fails
   */
  public static async deleteExpectParsedXml(session: AbstractSession, resource: string, reqHeaders: any[] = []): Promise<ICMCIApiResponse> {
    const data = await CicsCmciRestClient.deleteExpectString(session, resource, reqHeaders);
    const apiResponse = CicsCmciRestClient.parseStringSync(data);
    return CicsCmciRestClient.verifyResponseCodes(apiResponse);
  }

  /**
   * PUT a CMCI endpoint expecting an XML return value parsed into a JCL
   * Call the RestClient.putExpectString function assuming the response is XML, then return a promise of the JSON representation.
   * @static
   * @param {AbstractSession} session - representing connection to this api
   * @param {string} resource - URI for which this request should go against
   * @param {any} reqHeaders - headers to include in the REST request
   * @param payload - XML body to put or a javascript object to convert to XML
   * @returns {Promise<*>} - response body content from http(s) call
   * @throws {ImperativeError} verifyResponseCodes fails
   */
  public static async putExpectParsedXml(
    session: AbstractSession,
    resource: string,
    reqHeaders: any[] = [],
    payload: any
  ): Promise<ICMCIApiResponse> {
    if (payload != null) {
      payload = CicsCmciRestClient.convertPayloadToXML(payload);
    }
    const data = await CicsCmciRestClient.putExpectString(session, resource, reqHeaders, payload);
    const apiResponse = CicsCmciRestClient.parseStringSync(data);
    return CicsCmciRestClient.verifyResponseCodes(apiResponse);
  }

  /**
   * POST a CMCI endpoint expecting a XML return value
   * Calls the RestClient.postExpectString function assuming the response is XML, then return a promise of the JSON representation.
   * @static
   * @param {AbstractSession} session - representing connection to this api
   * @param {string} resource - URI for which this request should go against
   * @param {any} reqHeaders - headers to include in the REST request
   * @param payload - XML body to put or a javascript object to convert to XML
   * @returns {Promise<*>} - response body content from http(s) call
   * @throws {ImperativeError} verifyResponseCodes fails
   */
  public static async postExpectParsedXml(
    session: AbstractSession,
    resource: string,
    reqHeaders: any[] = [],
    payload: any
  ): Promise<ICMCIApiResponse> {
    if (payload != null) {
      payload = CicsCmciRestClient.convertPayloadToXML(payload);
    }
    const data = await CicsCmciRestClient.postExpectString(session, resource, reqHeaders, payload);
    const apiResponse: ICMCIApiResponse = CicsCmciRestClient.parseStringSync(data);
    return CicsCmciRestClient.verifyResponseCodes(apiResponse);
  }

  /**
   * Internal logger
   */
  private static mLogger: Logger;

  /**
   * Internal parser
   */
  private static mParser: Parser;

  /**
   * Detect if a rpayload is a string or an object
   * If it is an object, convert it to XML using xml2js
   * @param payload - the request body / payload
   * @returns {string} the XML that can be used as the request body
   */
  private static convertPayloadToXML(payload: any): string {
    if (isString(payload)) {
      // if it's already a string, use it verbatim
      return payload;
    } else {
      // if it's an object, turn it into XML
      return this.convertObjectToXML(payload);
    }
  }

  /**
   * Use the Brightside logger instead of the imperative logger
   * @return {Logger}
   */
  private static get log(): Logger {
    if (this.mLogger == null) {
      this.mLogger = Logger.getAppLogger();
    }
    return this.mLogger;
  }

  /**
   * Use a configured parser
   * @return {Parser}
   */
  private static get parser(): Parser {
    if (this.mParser == null) {
      this.mParser = new Parser({
        explicitArray: false, // Only create arrays if there are multiple tags with the same name
        mergeAttrs: true, // Do not use the attrKey, instead merge all attributes with the parent
        normalizeTags: true, // Guarantee that all tags are going to be lowercase
      });
    }
    return this.mParser;
  }

  /**
   * Check that we got the expected response codes from the API after a request
   * @param {ICMCIApiResponse} apiResponse - the parsed response
   * @returns {ICMCIApiResponse} - the response if it was correct
   * @throws {ImperativeError} request did not get the expected codes
   */
  private static verifyResponseCodes(apiResponse: ICMCIApiResponse): ICMCIApiResponse {
    if (
      apiResponse.response != null &&
      apiResponse.response.resultsummary != null &&
      apiResponse.response.resultsummary.api_response1 === CicsCmciRestClient.CMCI_SUCCESS_RESPONSE_1 &&
      apiResponse.response.resultsummary.api_response2 === CicsCmciRestClient.CMCI_SUCCESS_RESPONSE_2
    ) {
      // expected return code and reason code specify
      return apiResponse;
    } else {
      throw new ImperativeError({
        msg: CicsCmciMessages.cmciRequestFailed.message + "\n" + TextUtils.prettyJson(apiResponse),
      });
    }
  }

  /**
   * parse an XML string with XML2js
   * The API is already synchronous according to their documentation but requires a callback.
   * This is a wrapper that doesn't require a callback.
   * @param {string} str - the string of XML to parse
   * @returns {any} the object parsed from the XML
   * @throws {Error} xml2js.parseString fails
   */
  private static parseStringSync(str: string) {
    let result;
    let error: Error;
    this.parser.parseString(str, (err: any, r: any) => {
      error = err;
      result = r;
    });
    if (error != null) {
      throw error;
    }
    return result;
  }

  /**
   * Process an error encountered in the rest client
   * @param {IImperativeError} original - the original error automatically built by the abstract rest client
   * @returns {IImperativeError} - the processed error with details added
   */
  protected processError(original: IImperativeError): IImperativeError {
    original.msg = "CICS CMCI REST API Error:\n" + original.msg;
    let details = original.causeErrors;
    try {
      const xmlDetails = CicsCmciRestClient.parseStringSync(details);
      // if we didn't get an error, make the parsed details part of the error
      details = TextUtils.prettyJson(xmlDetails, undefined, false);
    } catch (e) {
      // if there's an error, the causeErrors text is not json
      this.log.debug("Encountered an error trying to parse causeErrors as XML  - causeErrors is likely not JSON format");
    }
    original.msg += "\n" + details; // add the data string which is the original error
    return original;
  }
}
