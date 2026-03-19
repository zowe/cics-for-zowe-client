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

import { type IImperativeError, RestClient, Session } from "@zowe/imperative";
import { CicsCmciRestClient } from "../../src";

describe("CicsCmciRestClient tests", () => {
  const dummySession = new Session({ hostname: "dummy" });
  const testEndpoint = "/CICSSystemManagement/testing";
  const dummyHeaders = [{ testEndpoint }];

  // Spy objects
  const restClientExpect = jest.spyOn(RestClient, "getExpectString");
  const deleteExpectStringSpy = jest.spyOn(RestClient, "deleteExpectString");
  const putExpectStringSpy = jest.spyOn(RestClient, "putExpectString");
  const postClientExpect = jest.spyOn(RestClient, "postExpectString");

  // Common XML response
  const commonXmlResponse =
    "<response>" +
    "<resultsummary api_response1='1024' api_response2='0' />" +
    "<records><program name='TESTPROG'/></records>" +
    "</response>";

  // Common expected JSON response
  const commonExpectedJson: any = {
    response: {
      resultsummary: {
        api_response1: "1024",
        api_response2: "0",
      },
      records: {
        program: {
          name: "TESTPROG",
        },
      },
    },
  };

  // XML response without records (for failOnNoData tests)
  const noRecordsXmlResponse = "<response>" + "<resultsummary api_response1='1024' api_response2='0' />" + "</response>";

  // Expected JSON for no records response
  const noRecordsExpectedJson: any = {
    response: {
      resultsummary: {
        api_response1: "1024",
        api_response2: "0",
      },
      records: {
        testing: [],
      },
    },
  };

  beforeEach(() => {
    restClientExpect.mockClear();
    deleteExpectStringSpy.mockClear();
    putExpectStringSpy.mockClear();
    postClientExpect.mockClear();
  });

  it("should return a formatted JSON object based on the XML retrieved", async () => {
    const breakfastMenu =
      "<response>" +
      "<resultsummary api_response1='1024' api_response2='0' />" +
      "<breakfast_menu>\n" +
      "<food>\n" +
      "<name>French Toast</name>\n" +
      "<price currency='USD'>$5.95</price>\n" +
      "</food>\n" +
      "<food>\n" +
      "<name>Homestyle Breakfast</name>\n" +
      "<price currency='USD' size='small'>$6.95</price>\n" +
      "<price currency='USD' size='medium'>$7.95</price>\n" +
      "<price currency='USD' size='large'>$8.95</price>\n" +
      "</food>\n" +
      "</breakfast_menu>" +
      "</response>";
    const breakfastMenuJson: any = {
      response: {
        resultsummary: {
          api_response1: "1024",
          api_response2: "0",
        },
        breakfast_menu: {
          food: [
            {
              name: "French Toast",
              price: {
                currency: "USD",
                _: "$5.95",
              },
            },
            {
              name: "Homestyle Breakfast",
              price: [
                {
                  currency: "USD",
                  size: "small",
                  _: "$6.95",
                },
                {
                  currency: "USD",
                  size: "medium",
                  _: "$7.95",
                },
                {
                  currency: "USD",
                  size: "large",
                  _: "$8.95",
                },
              ],
            },
          ],
        },
      },
    };
    restClientExpect.mockResolvedValueOnce(breakfastMenu);

    const response = await CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders);
    expect(restClientExpect).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders);
    expect(restClientExpect).toHaveBeenCalledTimes(1);
    expect(response).toEqual(breakfastMenuJson);
  });

  it("should delete stack from any CICS CMCI errors before presenting them to users", () => {
    const cicsCmciRestClient = new CicsCmciRestClient(dummySession);
    const shouldNotDeleteMessage = "This should not be deleted";
    const shouldDeleteMessage = "This should be deleted";
    const error: IImperativeError = {
      msg: "hello",
      causeErrors: JSON.stringify({
        stack: shouldDeleteMessage,
        shouldNotDelete: shouldNotDeleteMessage,
      }),
    };
    const processedError = (cicsCmciRestClient as any).processError(error);
    expect(processedError.msg).toContain(shouldNotDeleteMessage);
    expect(processedError.msg.indexOf()).toEqual(-1);
  });

  it("should convertObjectToXML", () => {
    expect(CicsCmciRestClient.convertObjectToXML({})).toEqual("<root/>");
    expect(
      CicsCmciRestClient.convertObjectToXML({
        attribute: {
          key: "value",
        },
        listHeader: [
          "value1",
          {
            object: "child",
          },
        ],
      })
    ).toEqual(`<root>
  <attribute>
    <key>value</key>
  </attribute>
  <listHeader>value1</listHeader>
  <listHeader>
    <object>child</object>
  </listHeader>
</root>`);
  });

  describe("deleteExpectParsedXml", () => {
    it("should return a formatted JSON object based on the XML retrieved from DELETE", async () => {
      deleteExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.deleteExpectParsedXml(dummySession, testEndpoint, dummyHeaders);
      expect(deleteExpectStringSpy).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders);
      expect(deleteExpectStringSpy).toHaveBeenCalledTimes(1);
      expect(response).toEqual(commonExpectedJson);
    });
  });

  describe("putExpectParsedXml", () => {
    it("should return a formatted JSON object based on the XML retrieved from PUT with object payload", async () => {
      const payload = { request: { update: { attributes: { status: "ENABLED" } } } };
      putExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      expect(response).toEqual(commonExpectedJson);
    });

    it("should return a formatted JSON object based on the XML retrieved from PUT with string payload", async () => {
      const payload = "<request><update><attributes><status>ENABLED</status></attributes></update></request>";
      putExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      expect(response).toEqual(commonExpectedJson);
    });

    it("should handle PUT with null payload", async () => {
      putExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, null);
      expect(putExpectStringSpy).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders, null);
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      expect(response).toEqual(commonExpectedJson);
    });

    it("should handle PUT with failOnNoData=false when no records returned", async () => {
      putExpectStringSpy.mockResolvedValueOnce(noRecordsXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, {}, { failOnNoData: false });
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      expect(response).toEqual(noRecordsExpectedJson);
    });
  });

  describe("postExpectParsedXml", () => {
    it("should return a formatted JSON object based on the XML retrieved from POST with object payload", async () => {
      const payload = { request: { create: { attributes: { name: "TESTPROG" } } } };
      postClientExpect.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(postClientExpect).toHaveBeenCalledTimes(1);
      expect(response).toEqual(commonExpectedJson);
    });

    it("should return a formatted JSON object based on the XML retrieved from POST with string payload", async () => {
      const payload = "<request><create><attributes><name>TESTPROG</name></attributes></create></request>";
      postClientExpect.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(postClientExpect).toHaveBeenCalledTimes(1);
      expect(response).toEqual(commonExpectedJson);
    });

    it("should handle POST with null payload", async () => {
      postClientExpect.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, null);
      expect(postClientExpect).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders, null);
      expect(postClientExpect).toHaveBeenCalledTimes(1);
      expect(response).toEqual(commonExpectedJson);
    });
  });
});
