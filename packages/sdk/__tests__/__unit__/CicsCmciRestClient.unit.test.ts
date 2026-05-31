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

  describe("Error handling with partial results", () => {
    // Test NOTPERMIT with records (partial authorization)
    it("should return records when NOTPERMIT error occurs but records are present", async () => {
      const notpermitWithRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1031' api_response2='1345' api_response1_alt='NOTPERMIT' api_response2_alt='USRID' />" +
        "<records><cicsmanagedregion name='MYREG1'/><cicsmanagedregion name='MYREG2'/></records>" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(notpermitWithRecordsXml);

      const response = await CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders);
      expect(restClientExpect).toHaveBeenCalledTimes(1);
      expect(response.response.records).toBeDefined();
      expect(response.response.records.cicsmanagedregion).toBeDefined();
      expect(response.response.resultsummary.api_response1).toBe("1031");
      expect(response.incompleteResults).toBe(true); // Flag should be set
    });

    // Test NOTPERMIT without records (complete authorization failure)
    it("should throw error when NOTPERMIT occurs with no records", async () => {
      const notpermitNoRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1031' api_response2='1345' api_response1_alt='NOTPERMIT' api_response2_alt='USRID' />" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(notpermitNoRecordsXml);

      await expect(CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders)).rejects.toThrow();
    });

    // Test other error codes with records (e.g., CMAS down scenario)
    it("should return records when other error codes occur but records are present", async () => {
      const errorWithRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1034' api_response2='0' api_response1_alt='NOTAVAILABLE' api_response2_alt='' />" +
        "<records><program name='PROG1'/><program name='PROG2'/></records>" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(errorWithRecordsXml);

      const response = await CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders);
      expect(restClientExpect).toHaveBeenCalledTimes(1);
      expect(response.response.records).toBeDefined();
      expect(response.response.records.program).toBeDefined();
      expect(response.response.resultsummary.api_response1).toBe("1034");
      expect(response.incompleteResults).toBe(true); // Flag should be set
    });

    // Test error without records still throws
    it("should throw error when error code occurs with no records", async () => {
      const errorNoRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1028' api_response2='0' api_response1_alt='INVALIDPARM' api_response2_alt='' />" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(errorNoRecordsXml);

      await expect(CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders)).rejects.toThrow();
    });

    // Test that OK response with no records still works (for failOnNoData=false)
    it("should handle OK response with no records when failOnNoData=false", async () => {
      const okNoRecordsXml = "<response>" + "<resultsummary api_response1='1024' api_response2='0' />" + "</response>";

      restClientExpect.mockResolvedValueOnce(okNoRecordsXml);

      const response = await CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders, { failOnNoData: false });
      expect(restClientExpect).toHaveBeenCalledTimes(1);
      expect(response.response.resultsummary.api_response1).toBe("1024");
      expect(response.incompleteResults).toBeUndefined(); // Flag should NOT be set for OK responses
    });

    // Test NODATA response code with failOnNoData=false
    it("should handle NODATA response when failOnNoData=false", async () => {
      const nodataXml =
        "<response>" +
        "<resultsummary api_response1='1027' api_response2='0' api_response1_alt='NODATA' api_response2_alt='' />" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(nodataXml);

      const response = await CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders, { failOnNoData: false });
      expect(restClientExpect).toHaveBeenCalledTimes(1);
      expect(response.response.resultsummary.api_response1).toBe("1027");
      expect(response.incompleteResults).toBeUndefined(); // Flag should NOT be set for NODATA responses
    });
  });

    // Test NOTPERMIT with empty records element (resource type not authorized)
    it("should throw error when NOTPERMIT occurs with empty records element", async () => {
      const notpermitEmptyRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1031' api_response2='1345' " +
        "api_response1_alt='NOTPERMIT' api_response2_alt='USRID' " +
        "recordcount='0' displayed_recordcount='0' />" +
        "<records></records>" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(notpermitEmptyRecordsXml);

      await expect(CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders)).rejects.toThrow();
    });
  });
});
