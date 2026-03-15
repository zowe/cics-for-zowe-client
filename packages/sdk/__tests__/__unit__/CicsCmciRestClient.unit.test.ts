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

  const restClientExpect = jest.spyOn(RestClient, "getExpectString");

  beforeEach(() => {
    restClientExpect.mockClear();
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
    restClientExpect.mockResolvedValue(breakfastMenu);

    const response = await CicsCmciRestClient.getExpectParsedXml(dummySession, testEndpoint, dummyHeaders);
    expect(restClientExpect).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders);
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
    const deleteClientExpect = jest.spyOn(RestClient, "deleteExpectString");

    beforeEach(() => {
      deleteClientExpect.mockClear();
    });

    it("should return a formatted JSON object based on the XML retrieved from DELETE", async () => {
      const xmlResponse =
        "<response>" +
        "<resultsummary api_response1='1024' api_response2='0' />" +
        "<records><program name='TESTPROG'/></records>" +
        "</response>";
      const expectedJson: any = {
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
      deleteClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.deleteExpectParsedXml(dummySession, testEndpoint, dummyHeaders);
      expect(deleteClientExpect).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders);
      expect(response).toEqual(expectedJson);
    });
  });

  describe("putExpectParsedXml", () => {
    const putClientExpect = jest.spyOn(RestClient, "putExpectString");

    beforeEach(() => {
      putClientExpect.mockClear();
    });

    it("should return a formatted JSON object based on the XML retrieved from PUT with object payload", async () => {
      const xmlResponse =
        "<response>" +
        "<resultsummary api_response1='1024' api_response2='0' />" +
        "<records><program name='TESTPROG'/></records>" +
        "</response>";
      const expectedJson: any = {
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
      const payload = { request: { update: { attributes: { status: "ENABLED" } } } };
      putClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(putClientExpect).toHaveBeenCalled();
      expect(response).toEqual(expectedJson);
    });

    it("should return a formatted JSON object based on the XML retrieved from PUT with string payload", async () => {
      const xmlResponse =
        "<response>" +
        "<resultsummary api_response1='1024' api_response2='0' />" +
        "<records><program name='TESTPROG'/></records>" +
        "</response>";
      const expectedJson: any = {
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
      const payload = "<request><update><attributes><status>ENABLED</status></attributes></update></request>";
      putClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(putClientExpect).toHaveBeenCalled();
      expect(response).toEqual(expectedJson);
    });

    it("should handle PUT with null payload", async () => {
      const xmlResponse =
        "<response>" +
        "<resultsummary api_response1='1024' api_response2='0' />" +
        "<records><program name='TESTPROG'/></records>" +
        "</response>";
      const expectedJson: any = {
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
      putClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, null);
      expect(putClientExpect).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders, null);
      expect(response).toEqual(expectedJson);
    });

    it("should handle PUT with failOnNoData=false when no records returned", async () => {
      const xmlResponse = "<response>" + "<resultsummary api_response1='1024' api_response2='0' />" + "</response>";
      const expectedJson: any = {
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
      putClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.putExpectParsedXml(dummySession, testEndpoint, dummyHeaders, {}, { failOnNoData: false });
      expect(response).toEqual(expectedJson);
    });
  });

  describe("postExpectParsedXml", () => {
    const postClientExpect = jest.spyOn(RestClient, "postExpectString");

    beforeEach(() => {
      postClientExpect.mockClear();
    });

    it("should return a formatted JSON object based on the XML retrieved from POST with object payload", async () => {
      const xmlResponse =
        "<response>" +
        "<resultsummary api_response1='1024' api_response2='0' />" +
        "<records><program name='TESTPROG'/></records>" +
        "</response>";
      const expectedJson: any = {
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
      const payload = { request: { create: { attributes: { name: "TESTPROG" } } } };
      postClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(postClientExpect).toHaveBeenCalled();
      expect(response).toEqual(expectedJson);
    });

    it("should return a formatted JSON object based on the XML retrieved from POST with string payload", async () => {
      const xmlResponse =
        "<response>" +
        "<resultsummary api_response1='1024' api_response2='0' />" +
        "<records><program name='TESTPROG'/></records>" +
        "</response>";
      const expectedJson: any = {
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
      const payload = "<request><create><attributes><name>TESTPROG</name></attributes></create></request>";
      postClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, payload);
      expect(postClientExpect).toHaveBeenCalled();
      expect(response).toEqual(expectedJson);
    });

    it("should handle POST with null payload", async () => {
      const xmlResponse =
        "<response>" +
        "<resultsummary api_response1='1024' api_response2='0' />" +
        "<records><program name='TESTPROG'/></records>" +
        "</response>";
      const expectedJson: any = {
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
      postClientExpect.mockResolvedValue(xmlResponse);

      const response = await CicsCmciRestClient.postExpectParsedXml(dummySession, testEndpoint, dummyHeaders, null);
      expect(postClientExpect).toHaveBeenCalledWith(dummySession, testEndpoint, dummyHeaders, null);
      expect(response).toEqual(expectedJson);
    });
  });
});
