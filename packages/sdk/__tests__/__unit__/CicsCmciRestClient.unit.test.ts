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
    it("should inject Content-Type and Content-Length headers and return parsed XML for PUT with object payload", async () => {
      const payload = { request: { update: { attributes: { $: { status: "ENABLED" } } } } };
      putExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = putExpectStringSpy.mock.calls[0][2];
      expect(calledHeaders).toEqual(expect.arrayContaining([{ "Content-Type": "application/xml" }]));
      const contentLengthHeader = calledHeaders.find((h) => h["Content-Length"] !== undefined);
      expect(contentLengthHeader).toBeDefined();
      expect(parseInt(contentLengthHeader["Content-Length"])).toBeGreaterThan(0);
      expect(response).toEqual(commonExpectedJson);
    });

    it("should inject Content-Type and Content-Length headers and return parsed XML for PUT with string payload", async () => {
      const payload = "<request><update><attributes><status>ENABLED</status></attributes></update></request>";
      putExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = putExpectStringSpy.mock.calls[0][2];
      expect(calledHeaders).toEqual(
        expect.arrayContaining([
          { "Content-Type": "application/xml" },
          { "Content-Length": Buffer.byteLength(payload).toString() },
        ])
      );
      expect(response).toEqual(commonExpectedJson);
    });

    it("should preserve caller-supplied headers alongside the injected Content-Type and Content-Length for PUT", async () => {
      const payload = "<request><action name=\"NEWCOPY\"/></request>";
      const extraHeader = { "X-CMCI-Header": "test-value" };
      putExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, [extraHeader], payload);
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = putExpectStringSpy.mock.calls[0][2];
      expect(calledHeaders).toEqual(
        expect.arrayContaining([
          { "Content-Type": "application/xml" },
          { "Content-Length": Buffer.byteLength(payload).toString() },
          extraHeader,
        ])
      );
    });

    it("should not inject Content-Type or Content-Length headers when PUT payload is null", async () => {
      putExpectStringSpy.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, null);
      expect(putExpectStringSpy).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders, null);
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = putExpectStringSpy.mock.calls[0][2];
      expect(calledHeaders.find((h) => h["Content-Type"])).toBeUndefined();
      expect(calledHeaders.find((h) => h["Content-Length"])).toBeUndefined();
      expect(response).toEqual(commonExpectedJson);
    });

    it("should handle PUT with failOnNoData=false when no records returned", async () => {
      const payload = "<root/>";
      putExpectStringSpy.mockResolvedValueOnce(noRecordsXmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload, { failOnNoData: false });
      expect(putExpectStringSpy).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = putExpectStringSpy.mock.calls[0][2];
      expect(calledHeaders).toEqual(expect.arrayContaining([{ "Content-Type": "application/xml" }]));
      expect(response).toEqual(noRecordsExpectedJson);
    });
  });

  describe("postExpectParsedXml", () => {
    it("should inject Content-Type and Content-Length headers and return parsed XML for POST with object payload", async () => {
      const payload = { request: { create: { attributes: { $: { name: "TESTPROG" } } } } };
      postClientExpect.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(postClientExpect).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = postClientExpect.mock.calls[0][2];
      expect(calledHeaders).toEqual(expect.arrayContaining([{ "Content-Type": "application/xml" }]));
      const contentLengthHeader = calledHeaders.find((h) => h["Content-Length"] !== undefined);
      expect(contentLengthHeader).toBeDefined();
      expect(parseInt(contentLengthHeader["Content-Length"])).toBeGreaterThan(0);
      expect(response).toEqual(commonExpectedJson);
    });

    it("should inject Content-Type and Content-Length headers and return parsed XML for POST with string payload", async () => {
      const payload = "<request><create><attributes><name>TESTPROG</name></attributes></create></request>";
      postClientExpect.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(postClientExpect).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = postClientExpect.mock.calls[0][2];
      expect(calledHeaders).toEqual(
        expect.arrayContaining([
          { "Content-Type": "application/xml" },
          { "Content-Length": Buffer.byteLength(payload).toString() },
        ])
      );
      expect(response).toEqual(commonExpectedJson);
    });

    it("should preserve caller-supplied headers alongside the injected Content-Type and Content-Length for POST", async () => {
      const payload = "<request><create><attributes><name>TESTPROG</name></attributes></create></request>";
      const extraHeader = { "X-CMCI-Header": "test-value" };
      postClientExpect.mockResolvedValueOnce(commonXmlResponse);

      await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, [extraHeader], payload);
      expect(postClientExpect).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = postClientExpect.mock.calls[0][2];
      expect(calledHeaders).toEqual(
        expect.arrayContaining([
          { "Content-Type": "application/xml" },
          { "Content-Length": Buffer.byteLength(payload).toString() },
          extraHeader,
        ])
      );
    });

    it("should not inject Content-Type or Content-Length headers when POST payload is null", async () => {
      postClientExpect.mockResolvedValueOnce(commonXmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, null);
      expect(postClientExpect).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders, null);
      expect(postClientExpect).toHaveBeenCalledTimes(1);
      const calledHeaders: any[] = postClientExpect.mock.calls[0][2];
      expect(calledHeaders.find((h) => h["Content-Type"])).toBeUndefined();
      expect(calledHeaders.find((h) => h["Content-Length"])).toBeUndefined();
      expect(response).toEqual(commonExpectedJson);
    });
  });

  describe("Error handling with incomplete results", () => {
    // Test NOTPERMIT with records - SDK throws error with incomplete records
    it("should throw error when NOTPERMIT error occurs even with records present", async () => {
      const notpermitWithRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1031' api_response2='1345' api_response1_alt='NOTPERMIT' api_response2_alt='USRID' />" +
        "<records><cicsmanagedregion name='MYREG1'/><cicsmanagedregion name='MYREG2'/></records>" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(notpermitWithRecordsXml);

      await expect(CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders)).rejects.toThrow();
    });

    // Test NOTPERMIT with records using useCICSCmciRestError option - should throw CicsCmciRestError with incomplete records
    it("should throw CicsCmciRestError with incomplete records when NOTPERMIT occurs with records", async () => {
      const notpermitWithRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1031' api_response2='1345' api_response1_alt='NOTPERMIT' api_response2_alt='USRID' />" +
        "<records><cicsmanagedregion name='MYREG1'/><cicsmanagedregion name='MYREG2'/></records>" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(notpermitWithRecordsXml);

      try {
        await CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders, { useCICSCmciRestError: true });
        fail("Should have thrown an error");
      } catch (error: any) {
        expect(restClientExpect).toHaveBeenCalledTimes(1);
        expect(error.resultSummary.api_response1).toBe("1031");
        expect(error.resultSummary.api_response1_alt).toBe("NOTPERMIT");
        expect(error.records).toBeDefined();
        expect(error.records.cicsmanagedregion).toHaveLength(2);
        expect(error.records.cicsmanagedregion[0].name).toBe("MYREG1");
        expect(error.records.cicsmanagedregion[1].name).toBe("MYREG2");
      }
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

    // Test other error codes with records (e.g., NOTAVAILABLE) - should throw error with incomplete records
    it("should throw error when other error codes occur even with records", async () => {
      const errorWithRecordsXml =
        "<response>" +
        "<resultsummary api_response1='1034' api_response2='0' api_response1_alt='NOTAVAILABLE' api_response2_alt='' />" +
        "<records><program name='PROG1'/><program name='PROG2'/></records>" +
        "</response>";

      restClientExpect.mockResolvedValueOnce(errorWithRecordsXml);

      await expect(CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders)).rejects.toThrow();
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
      // SDK returns response as-is; OK responses have no errors
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
      // SDK returns response as-is; NODATA is an accepted response code
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
