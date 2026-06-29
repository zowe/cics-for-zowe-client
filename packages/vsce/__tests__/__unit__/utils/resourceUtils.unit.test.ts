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

const successResponse = {
  response: {
    resultsummary: {
      api_response1: "",
      api_response2: "",
      displayed_recordcount: "2",
      recordcount: "2",
    },
    records: [
      {
        program: "PROG1",
        status: "ENABLED",
        newcopycnt: "0",
        eyu_cicsname: "MYREG",
        enablestatus: "ENABLED",
        progtype: "PROGRAM",
        library: "MYLIB",
        librarydsn: "MYLIBDSN",
      },
      {
        program: "PROG2",
        status: "DISABLED",
        newcopycnt: "2",
        eyu_cicsname: "MYREG",
        enablestatus: "ENABLED",
        progtype: "PROGRAM",
        library: "MYLIB",
        librarydsn: "MYLIBDSN",
      },
    ],
  },
};

import { CICSSession, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { AuthOrder, RestClientError } from "@zowe/imperative";
import { SessionHandler } from "../../../src/resources";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import * as errorUtils from "../../../src/utils/errorUtils";
import {
  buildNewSession,
  buildRequestLoggerString,
  buildRequestOptions,
  buildResourceParms,
  buildUserAgentHeader,
  runGetResource,
  runPutResource,
} from "../../../src/utils/resourceUtils";
import { getResourceMock, profile } from "../../__mocks__";

getResourceMock.mockResolvedValue(successResponse);

const authOrderSpy = jest.spyOn(AuthOrder, "makingRequestForToken");
const loggerSpy = jest.spyOn(CICSLogger, "debug");

describe("Resource Util Helper methods", () => {
  beforeEach(() => {
    authOrderSpy.mockReset();
  });

  it("should build user agent string", () => {
    const userAgent = buildUserAgentHeader();
    expect(userAgent).toEqual({ "User-Agent": "zowe.cics-extension-for-zowe/3.15.0 zowe.vscode-extension-for-zowe/3.15.0" });
  });

  it("builds resource params object with all specified", () => {
    const parms = buildResourceParms("MYRES", "MYREG", "MYPLEX", {
      criteria: "MYCRIT",
      parameter: "MYPARAM",
      queryParams: { nodiscard: true, overrideWarningCount: true, summonly: true },
    });
    expect(parms).toEqual({
      name: "MYRES",
      regionName: "MYREG",
      cicsPlex: "MYPLEX",
      criteria: "MYCRIT",
      parameter: "MYPARAM",
      queryParams: { nodiscard: true, overrideWarningCount: true, summonly: true },
    });
  });

  it("builds resource params object with none specified", () => {
    const parms = buildResourceParms("MYRES", "MYREG", "MYPLEX", {});
    expect(parms).toEqual({
      name: "MYRES",
      regionName: "MYREG",
      cicsPlex: "MYPLEX",
    });
  });

  it("builds resource params object with some specified", () => {
    const parms = buildResourceParms("MYRES", "MYREG", "MYPLEX", { queryParams: { nodiscard: true } });
    expect(parms).toEqual({
      name: "MYRES",
      regionName: "MYREG",
      cicsPlex: "MYPLEX",
      queryParams: { nodiscard: true },
    });
  });

  it("builds request options", () => {
    const parms = buildRequestOptions();
    expect(parms).toEqual({ failOnNoData: false, useCICSCmciRestError: true });
  });

  it("builds new session", () => {
    const sess = buildNewSession(profile);

    expect(sess).toBeDefined();
    expect(sess?.ISession).toBeDefined();
    expect(authOrderSpy).toHaveBeenCalledTimes(1);
  });

  it("should build a GET request string with string and boolean options", () => {
    const logString = buildRequestLoggerString("profilename", "GET", "MYRES", { MORE: "OPTIONS", SPECIFIED: true });
    expect(logString).toEqual("profilename: GET MYRES, MORE[OPTIONS], SPECIFIED[true]");
  });

  it("should build a PUT request string with no options", () => {
    const logString = buildRequestLoggerString("profilename", "PUT", "MYRES");
    expect(logString).toEqual("profilename: PUT MYRES");
  });

  it("should build a POST request string with upper and lowercase options", () => {
    const logString = buildRequestLoggerString("profilename", "POST", "MYRES", { lower: "case", UPPER: "CASE" });
    expect(logString).toEqual("profilename: POST MYRES, LOWER[case], UPPER[CASE]");
  });

  it("should build a PUT request string with request body", () => {
    const requestBody = { request: { action: { $: { name: "DISABLE" } } } };
    const logString = buildRequestLoggerString("profilename", "PUT", "MYRES", { regionName: "MYREG" }, requestBody);
    expect(logString).toEqual('profilename: PUT MYRES, REGIONNAME[MYREG], REQUESTBODY[{"request":{"action":{"$":{"name":"DISABLE"}}}}]');
  });

  it("should build a request string with falsy values in options", () => {
    const logString = buildRequestLoggerString("profilename", "GET", "MYRES", {
      zero: 0,
      emptyString: "",
      falseBool: false,
      nullValue: null,
      undefinedValue: undefined
    });
    // Only truthy values should be included
    expect(logString).toEqual("profilename: GET MYRES");
  });

  it("should build resource params with undefined regionName and cicsPlex", () => {
    const parms = buildResourceParms("MYRES", undefined, undefined, {});
    expect(parms).toEqual({
      name: "MYRES",
    });
  });

  it("should build resource params with null regionName and cicsPlex", () => {
    const parms = buildResourceParms("MYRES", null as any, null as any, {});
    expect(parms).toEqual({
      name: "MYRES",
    });
  });
});

describe("Resource Util requesters", () => {
  beforeEach(() => {
    authOrderSpy.mockReset();
    loggerSpy.mockReset();
  });

  it("should get a resource", async () => {
    let response: ICMCIApiResponse | undefined;
    let error;

    try {
      response = await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });
    } catch (err) {
      error = err;
    }

    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(`MYPROF: GET MYRES`);

    expect(getResourceMock).toHaveBeenCalledTimes(1);
    expect(authOrderSpy).toHaveBeenCalledTimes(1);

    expect(error).toBeUndefined();
    expect(response).toBeDefined();
    expect(response).toHaveProperty("response");
    expect(response?.response).toHaveProperty("resultsummary");
    expect(response?.response.resultsummary).toHaveProperty("recordcount");
  });

  it("should make a second request if first errors", async () => {
    getResourceMock.mockReset();

    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    getResourceMock
      .mockImplementationOnce(() => {
        throw errorToThrow;
      })
      .mockImplementationOnce(() => {
        return successResponse;
      });

    let response: ICMCIApiResponse | undefined;
    let error;

    try {
      response = await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });
    } catch (err) {
      error = err;
    }

    expect(getErrorCodeMock).toHaveBeenCalledTimes(1);
    expect(getErrorCodeMock).toHaveBeenCalledWith(errorToThrow);

    expect(loggerSpy).toHaveBeenCalledTimes(2);

    expect(getResourceMock).toHaveBeenCalledTimes(2);
    expect(authOrderSpy).toHaveBeenCalledTimes(1);

    expect(error).toBeUndefined();
    expect(response).toBeDefined();
    expect(response).toHaveProperty("response");
    expect(response?.response).toHaveProperty("resultsummary");
    expect(response?.response.resultsummary).toHaveProperty("recordcount");
  });

  it("should handle error when not 401 or no token", async () => {
    getResourceMock.mockReset();

    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "500" });

    getResourceMock.mockImplementationOnce(() => {
      throw errorToThrow;
    });

    let error;

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });
    } catch (err) {
      error = err;
    }

    expect(getErrorCodeMock).toHaveBeenCalledTimes(1);
    expect(error).toBeDefined();
    expect(getResourceMock).toHaveBeenCalledTimes(1);
  });

  it("should handle error when both initial request and retry fail with 401", async () => {
    getResourceMock.mockReset();

    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    getResourceMock.mockImplementation(() => {
      throw errorToThrow;
    });

    let error;

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });
    } catch (err) {
      error = err;
    }

    expect(getErrorCodeMock).toHaveBeenCalledTimes(1);
    expect(error).toBeDefined();
    expect(getResourceMock).toHaveBeenCalledTimes(2);
  });

  it("should handle error when session token is undefined on retry", async () => {
    getResourceMock.mockReset();

    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = undefined;
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    getResourceMock.mockImplementationOnce(() => {
      throw errorToThrow;
    });

    let error;

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });
    } catch (err) {
      error = err;
    }

    expect(getErrorCodeMock).toHaveBeenCalledTimes(1);
    expect(error).toBeDefined();
    // Should not retry when token is undefined
    expect(getResourceMock).toHaveBeenCalledTimes(1);
  });

  it("should handle error with params undefined", async () => {
    getResourceMock.mockReset();

    const errorToThrow = new Error("Test error");
    getResourceMock.mockRejectedValue(errorToThrow);

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      expect(error.cicsExtensionError.resourceName).toBeUndefined();
    }
  });

  it("should handle error when retry succeeds after 401", async () => {
    getResourceMock.mockReset();

    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    // First call throws 401, second call succeeds
    getResourceMock
      .mockImplementationOnce(() => {
        throw errorToThrow;
      })
      .mockResolvedValueOnce(successResponse);

    const result = await runGetResource({
      profileName: "MYPROF",
      resourceName: "MYRES",
    });

    expect(getErrorCodeMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(successResponse);
    expect(getResourceMock).toHaveBeenCalledTimes(2);
  });

  it("should call AuthOrder.makingRequestForToken when session has no token", async () => {
    getResourceMock.mockReset();
    getResourceMock.mockResolvedValue(successResponse);

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = undefined;
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    await runGetResource({
      profileName: "MYPROF",
      resourceName: "MYRES",
    });

    expect(authOrderSpy).toHaveBeenCalledTimes(1);
    expect(authOrderSpy).toHaveBeenCalledWith(fakeCICSSession.ISession);
  });

  it("should convert error to incomplete response on retry in runGetResource", async () => {
    getResourceMock.mockReset();

    const convertErrorSpy = jest.spyOn(errorUtils, "convertErrorToIncompleteResponse");
    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    const mockIncompleteResponse = {
      response: {
        resultsummary: {
          api_response1: "1031",
          api_response2: "",
          recordcount: "1",
          displayed_recordcount: "1",
        },
        records: {
          cicsprogram: [{ program: "PROG1" }],
        },
      },
    };

    getErrorCodeMock.mockReturnValue(401);
    // First call returns null (no incomplete response), second call returns incomplete response
    convertErrorSpy.mockReturnValueOnce(null).mockReturnValueOnce(mockIncompleteResponse);

    getResourceMock
      .mockImplementationOnce(() => {
        throw errorToThrow;
      })
      .mockImplementationOnce(() => {
        throw errorToThrow;
      });

    const result = await runGetResource({
      profileName: "MYPROF",
      resourceName: "MYRES",
    });

    expect(result).toBeDefined();
    expect(result).toEqual(mockIncompleteResponse);
    expect(convertErrorSpy).toHaveBeenCalledTimes(2);
  });

});

describe("runGetCache", () => {
  const { runGetCache } = require("../../../src/utils/resourceUtils");
  const { getCacheMock } = require("../../__mocks__");
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should get cache successfully", async () => {
    const mockResponse = {
      response: {
        records: { cicscicsplex: [{ name: "PLEX1" }] },
      },
    };
    
    getCacheMock.mockResolvedValue(mockResponse);

    const result = await runGetCache(
      { profileName: "MYPROF", cacheToken: "TOKEN123" },
      { nodiscard: true, summonly: false }
    );

    expect(result).toEqual(mockResponse);
    expect(getCacheMock).toHaveBeenCalled();
  });


  it("should use default query params", async () => {
    const mockResponse = { response: { records: {} } };
    getCacheMock.mockResolvedValue(mockResponse);

    await runGetCache({ profileName: "MYPROF", cacheToken: "TOKEN123" });

    expect(getCacheMock).toHaveBeenCalled();
  });

  it("should throw error on non-401 error", async () => {
    getCacheMock.mockReset();
    
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "500" });
    
    getCacheMock.mockImplementationOnce(() => {
      throw errorToThrow;
    });
    
    await expect(
      runGetCache({ profileName: "MYPROF", cacheToken: "TOKEN123" })
    ).rejects.toThrow();
    
    expect(getCacheMock).toHaveBeenCalledTimes(1);
  });

  it("should retry on 401 error with token and succeed", async () => {
    getCacheMock.mockReset();
    
    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });
    const mockResponse = { response: { records: {} } };
    
    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    const getSessionSpy = jest.spyOn(SessionHandler.prototype, "getSession");
    getSessionSpy.mockReturnValueOnce(fakeCICSSession);
    getSessionSpy.mockReturnValueOnce(fakeCICSSession); // For buildNewSession
    
    getErrorCodeMock.mockReturnValue(401);
    
    getCacheMock
      .mockImplementationOnce(() => {
        throw errorToThrow;
      })
      .mockResolvedValueOnce(mockResponse);
    
    const result = await runGetCache({ profileName: "MYPROF", cacheToken: "TOKEN123" });
    
    expect(result).toEqual(mockResponse);
    expect(getCacheMock).toHaveBeenCalledTimes(2);
  });

  it("should throw error when retry also fails with 401", async () => {
    getCacheMock.mockReset();
    
    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });
    
    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    const getSessionSpy = jest.spyOn(SessionHandler.prototype, "getSession");
    getSessionSpy.mockReturnValueOnce(fakeCICSSession);
    getSessionSpy.mockReturnValueOnce(fakeCICSSession); // For buildNewSession
    
    getErrorCodeMock.mockReturnValue(401);
    
    getCacheMock.mockImplementation(() => {
      throw errorToThrow;
    });
    
    await expect(
      runGetCache({ profileName: "MYPROF", cacheToken: "TOKEN123" })
    ).rejects.toThrow();
    
    expect(getCacheMock).toHaveBeenCalledTimes(2);
  });

  it("should throw error on 401 when no token value", async () => {
    getCacheMock.mockReset();
    
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });
    
    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = undefined;
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);
    
    getCacheMock.mockImplementationOnce(() => {
      throw errorToThrow;
    });
    
    await expect(
      runGetCache({ profileName: "MYPROF", cacheToken: "TOKEN123" })
    ).rejects.toThrow();
    
    expect(getCacheMock).toHaveBeenCalledTimes(1);
  });

  it("should call AuthOrder.makingRequestForToken when session has no token", async () => {
    getCacheMock.mockReset();
    const mockResponse = { response: { records: {} } };
    getCacheMock.mockResolvedValue(mockResponse);

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = undefined;
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    await runGetCache({ profileName: "MYPROF", cacheToken: "TOKEN123" });

    expect(authOrderSpy).toHaveBeenCalledTimes(1);
    expect(authOrderSpy).toHaveBeenCalledWith(fakeCICSSession.ISession);
  });

  it("should convert error to incomplete response on retry in runGetCache", async () => {
    getCacheMock.mockReset();

    const convertErrorSpy = jest.spyOn(errorUtils, "convertErrorToIncompleteResponse");
    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    const getSessionSpy = jest.spyOn(SessionHandler.prototype, "getSession");
    getSessionSpy.mockReturnValueOnce(fakeCICSSession);
    getSessionSpy.mockReturnValueOnce(fakeCICSSession);

    const mockIncompleteResponse = {
      response: {
        resultsummary: {
          api_response1: "1031",
          api_response2: "",
          recordcount: "1",
          displayed_recordcount: "1",
        },
        records: {
          cicsprogram: [{ program: "PROG1" }],
        },
      },
    };

    getErrorCodeMock.mockReturnValue(401);
    // First call returns null (no incomplete response), second call returns incomplete response
    convertErrorSpy.mockReturnValueOnce(null).mockReturnValueOnce(mockIncompleteResponse);

    getCacheMock
      .mockImplementationOnce(() => {
        throw errorToThrow;
      })
      .mockImplementationOnce(() => {
        throw errorToThrow;
      });

    const result = await runGetCache({ profileName: "MYPROF", cacheToken: "TOKEN123" });

    expect(result).toBeDefined();
    expect(result).toEqual(mockIncompleteResponse);
    expect(convertErrorSpy).toHaveBeenCalledTimes(2);
  });
});

describe("runPutResource", () => {
  const { runPutResource } = require("../../../src/utils/resourceUtils");
  const { putResourceMock } = require("../../__mocks__");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should put resource successfully", async () => {
    const mockResponse = { response: { resultsummary: {} } };
    const requestBody = { request: { action: { $: { name: "ENABLE" } } } };

    putResourceMock.mockResolvedValue(mockResponse);

    const result = await runPutResource(
      {
        profileName: "MYPROF",
        resourceName: "MYRES",
        regionName: "MYREG",
        cicsPlex: "MYPLEX",
      },
      requestBody
    );

    expect(result).toEqual(mockResponse);
    expect(putResourceMock).toHaveBeenCalled();
  });

  it("should throw error on non-401 error", async () => {
    putResourceMock.mockReset();
    
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "500" });
    const requestBody = { request: { action: { $: { name: "ENABLE" } } } };
    
    putResourceMock.mockImplementationOnce(() => {
      throw errorToThrow;
    });
    
    await expect(
      runPutResource(
        {
          profileName: "MYPROF",
          resourceName: "MYRES",
          regionName: "MYREG",
          cicsPlex: "MYPLEX",
        },
        requestBody
      )
    ).rejects.toThrow();
    
    expect(putResourceMock).toHaveBeenCalledTimes(1);
  });

  it("should retry on 401 error with token and succeed", async () => {
    putResourceMock.mockReset();
    
    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });
    const mockResponse = { response: { resultsummary: {} } };
    const requestBody = { request: { action: { $: { name: "ENABLE" } } } };
    
    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    const getSessionSpy = jest.spyOn(SessionHandler.prototype, "getSession");
    getSessionSpy.mockReturnValueOnce(fakeCICSSession);
    getSessionSpy.mockReturnValueOnce(fakeCICSSession); // For buildNewSession
    
    getErrorCodeMock.mockReturnValue(401);
    
    putResourceMock
      .mockImplementationOnce(() => {
        throw errorToThrow;
      })
      .mockResolvedValueOnce(mockResponse);
    
    const result = await runPutResource(
      {
        profileName: "MYPROF",
        resourceName: "MYRES",
        regionName: "MYREG",
        cicsPlex: "MYPLEX",
      },
      requestBody
    );
    
    expect(result).toEqual(mockResponse);
    expect(putResourceMock).toHaveBeenCalledTimes(2);
  });

  it("should throw error when retry also fails with 401", async () => {
    putResourceMock.mockReset();
    
    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });
    const requestBody = { request: { action: { $: { name: "ENABLE" } } } };
    
    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = '""';
    const getSessionSpy = jest.spyOn(SessionHandler.prototype, "getSession");
    getSessionSpy.mockReturnValueOnce(fakeCICSSession);
    getSessionSpy.mockReturnValueOnce(fakeCICSSession); // For buildNewSession
    
    getErrorCodeMock.mockReturnValue(401);
    
    putResourceMock.mockImplementation(() => {
      throw errorToThrow;
    });
    
    await expect(
      runPutResource(
        {
          profileName: "MYPROF",
          resourceName: "MYRES",
          regionName: "MYREG",
          cicsPlex: "MYPLEX",
        },
        requestBody
      )
    ).rejects.toThrow();
    
    expect(putResourceMock).toHaveBeenCalledTimes(2);
  });

  it("should throw error on 401 when no token value", async () => {
    putResourceMock.mockReset();
    
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });
    const requestBody = { request: { action: { $: { name: "ENABLE" } } } };
    
    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = undefined;
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);
    
    putResourceMock.mockImplementationOnce(() => {
      throw errorToThrow;
    });
    
    await expect(
      runPutResource(
        {
          profileName: "MYPROF",
          resourceName: "MYRES",
          regionName: "MYREG",
          cicsPlex: "MYPLEX",
        },
        requestBody
      )
    ).rejects.toThrow();
    
    expect(putResourceMock).toHaveBeenCalledTimes(1);
  });

  it("should call AuthOrder.makingRequestForToken when session has no token", async () => {
    putResourceMock.mockReset();
    const mockResponse = { response: { resultsummary: {} } };
    const requestBody = { request: { action: { $: { name: "ENABLE" } } } };
    putResourceMock.mockResolvedValue(mockResponse);

    const fakeCICSSession = new CICSSession(profile.profile!);
    fakeCICSSession.ISession.tokenValue = undefined;
    jest.spyOn(SessionHandler.prototype, "getSession").mockReturnValueOnce(fakeCICSSession);

    await runPutResource(
      {
        profileName: "MYPROF",
        resourceName: "MYRES",
        regionName: "MYREG",
        cicsPlex: "MYPLEX",
      },
      requestBody
    );

    expect(authOrderSpy).toHaveBeenCalledTimes(1);
    expect(authOrderSpy).toHaveBeenCalledWith(fakeCICSSession.ISession);
  });

  it("should handle error with params undefined in runPutResource", async () => {
    putResourceMock.mockReset();

    const errorToThrow = new Error("Test error");
    const requestBody = { request: { action: { $: { name: "ENABLE" } } } };
    putResourceMock.mockRejectedValue(errorToThrow);

    try {
      await runPutResource(
        {
          profileName: "MYPROF",
          resourceName: "MYRES",
          regionName: "MYREG",
          cicsPlex: "MYPLEX",
        },
        requestBody
      );
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      expect(error.cicsExtensionError.resourceName).toBeUndefined();
    }
  });
});

describe("pollForCompleteAction", () => {
  const { pollForCompleteAction } = require("../../../src/utils/resourceUtils");

  beforeEach(() => {
    jest.clearAllMocks();
    getResourceMock.mockResolvedValue(successResponse);
  });

  it("should poll until criteria is met", async () => {
    const mockNode = {
      getProfile: () => profile,
      getContainedResource: () => ({
        meta: {
          resourceName: "MYRES",
          getName: () => "TESTPROG",
          buildCriteria: () => "PROGRAM=TESTPROG",
        },
        resource: {},
      }),
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    };

    const isCompletionCriteriaMet = jest.fn().mockReturnValue(true);
    const criteriaMetCallback = jest.fn();

    await pollForCompleteAction(mockNode, isCompletionCriteriaMet, criteriaMetCallback);

    expect(isCompletionCriteriaMet).toHaveBeenCalled();
    expect(criteriaMetCallback).toHaveBeenCalled();
    expect(getResourceMock).toHaveBeenCalled();
  });

  it("should poll multiple times until criteria is met", async () => {
    const mockNode = {
      getProfile: () => profile,
      getContainedResource: () => ({
        meta: {
          resourceName: "MYRES",
          getName: () => "TESTPROG",
          buildCriteria: () => "PROGRAM=TESTPROG",
        },
        resource: {},
      }),
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    };

    const isCompletionCriteriaMet = jest.fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const criteriaMetCallback = jest.fn();

    await pollForCompleteAction(mockNode, isCompletionCriteriaMet, criteriaMetCallback);

    expect(isCompletionCriteriaMet).toHaveBeenCalledTimes(3);
    expect(criteriaMetCallback).toHaveBeenCalled();
    expect(getResourceMock).toHaveBeenCalledTimes(3);
  });

  it("should poll with parent resource", async () => {
    const parentResource = { name: "PARENT" };
    const mockNode = {
      getProfile: () => profile,
      getContainedResource: () => ({
        meta: {
          resourceName: "MYRES",
          getName: () => "TESTPROG",
          buildCriteria: (names: string[], parent: unknown) => {
            expect(parent).toBe(parentResource);
            return "PROGRAM=TESTPROG";
          },
        },
        resource: {},
      }),
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    };

    const isCompletionCriteriaMet = jest.fn().mockReturnValue(true);
    const criteriaMetCallback = jest.fn();

    await pollForCompleteAction(mockNode, isCompletionCriteriaMet, criteriaMetCallback, parentResource);

    expect(criteriaMetCallback).toHaveBeenCalled();
  });

  it("should stop polling after max retries and call callback with last response", async () => {
    const mockNode = {
      getProfile: () => profile,
      getContainedResource: () => ({
        meta: {
          resourceName: "MYRES",
          getName: () => "TESTPROG",
          buildCriteria: () => "PROGRAM=TESTPROG",
        },
        resource: {},
      }),
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    };

    // Mock criteria to never be met
    const isCompletionCriteriaMet = jest.fn().mockReturnValue(false);
    const criteriaMetCallback = jest.fn();

    // Mock setTimeout to execute immediately
    jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });

    await pollForCompleteAction(mockNode, isCompletionCriteriaMet, criteriaMetCallback);

    // Should poll exactly POLL_FOR_ACTION_DEFAULT_RETRIES times (default is 10)
    expect(getResourceMock).toHaveBeenCalledTimes(10);
    expect(isCompletionCriteriaMet).toHaveBeenCalledTimes(10);
    // Callback should still be called with the last response
    expect(criteriaMetCallback).toHaveBeenCalled();
    expect(criteriaMetCallback).toHaveBeenCalledWith(successResponse);

    // Restore setTimeout
    jest.restoreAllMocks();
  });
});

describe("convertErrorToIncompleteResponse handling", () => {
  beforeEach(() => {
    getResourceMock.mockReset();
  });

  it("should convert error with incomplete records to successful response in runGetResource", async () => {
    const mockError = {
      resultSummary: {
        api_response1: "1031",
        api_response1_alt: "NOTPERMIT",
        api_response2: "0",
        api_response2_alt: "USRID",
        recordcount: "2",
      },
      records: {
        cicsprogram: [{ program: "PROG1" }, { program: "PROG2" }],
      },
      errors: { feedback: { resp: "16" } },
    };

    getResourceMock.mockRejectedValue(mockError);

    const result = await runGetResource({
      profileName: "MYPROF",
      resourceName: "MYRES",
    });

    expect(result).toBeDefined();
    expect(result.response.resultsummary).toEqual(mockError.resultSummary);
    expect(result.response.records).toEqual(mockError.records);
    expect(result.response.errors).toEqual(mockError.errors);
  });

  it("should convert error with incomplete records to successful response in runGetCache", async () => {
    const { runGetCache } = require("../../../src/utils/resourceUtils");
    const { getCacheMock } = require("../../__mocks__");
    
    getCacheMock.mockReset();

    const mockError = {
      resultSummary: {
        api_response1: "1031",
        api_response1_alt: "NOTPERMIT",
        recordcount: "1",
      },
      records: {
        cicsprogram: [{ program: "PROG1" }],
      },
    };

    getCacheMock.mockRejectedValue(mockError);

    const result = await runGetCache({
      profileName: "MYPROF",
      cacheToken: "TOKEN123",
    });

    expect(result).toBeDefined();
    expect(result.response.resultsummary).toEqual(mockError.resultSummary);
    expect(result.response.records).toEqual(mockError.records);
  });

});

describe("getResourceNameFromCriteria error handling", () => {
  beforeEach(() => {
    getResourceMock.mockReset();
  });

  it("should extract single resource name from criteria in error message", async () => {
    const errorToThrow = new Error("Test error");
    getResourceMock.mockRejectedValue(errorToThrow);

    const expectedResourceName = "TESTPROG";

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
        params: {
          criteria: `PROGRAM=${expectedResourceName}`,
        },
      });
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      expect(error.cicsExtensionError.resourceName).toBe(expectedResourceName);
      // Verify the extraction logic worked correctly
      expect(error.cicsExtensionError.resourceName).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it("should extract multiple resource names from OR criteria in error message", async () => {
    const errorToThrow = new Error("Test error");
    getResourceMock.mockRejectedValue(errorToThrow);

    const expectedNames = ["PROG1", "PROG2", "PROG3"];
    const expectedResourceName = expectedNames.join(", ");

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
        params: {
          criteria: "PROGRAM=PROG1 OR PROGRAM=PROG2 OR PROGRAM=PROG3",
        },
      });
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      expect(error.cicsExtensionError.resourceName).toBe(expectedResourceName);
      // Verify all names were extracted
      expectedNames.forEach(name => {
        expect(error.cicsExtensionError.resourceName).toContain(name);
      });
    }
  });

  it("should handle criteria with spaces around equals sign", async () => {
    const errorToThrow = new Error("Test error");
    getResourceMock.mockRejectedValue(errorToThrow);

    const expectedNames = ["PROG1", "PROG2"];
    const expectedResourceName = expectedNames.join(", ");

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
        params: {
          criteria: "PROGRAM = PROG1 OR PROGRAM = PROG2",
        },
      });
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      expect(error.cicsExtensionError.resourceName).toBe(expectedResourceName);
      // Verify extraction handles spaces in criteria correctly (extracts clean names)
      expectedNames.forEach(name => {
        expect(error.cicsExtensionError.resourceName).toContain(name);
      });
      // Verify the format is "NAME1, NAME2" (comma-space separated)
      expect(error.cicsExtensionError.resourceName).toMatch(/^[A-Z0-9]+(, [A-Z0-9]+)*$/);
    }
  });

  it("should handle undefined criteria gracefully", async () => {
    const errorToThrow = new Error("Test error");
    getResourceMock.mockRejectedValue(errorToThrow);

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
        params: {},
      });
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      expect(error.cicsExtensionError.resourceName).toBeUndefined();
    }
  });

  it("should extract resource names in PUT request errors", async () => {
    const { putResourceMock } = require("../../__mocks__");
    putResourceMock.mockReset();
    
    const errorToThrow = new Error("PUT error");
    putResourceMock.mockRejectedValue(errorToThrow);

    const expectedNames = ["TRN1", "TRN2"];
    const expectedResourceName = expectedNames.join(", ");

    try {
      await runPutResource(
        {
          profileName: "MYPROF",
          resourceName: "MYRES",
          regionName: "MYREG",
          cicsPlex: "MYPLEX",
          params: {
            criteria: "TRANSACTION=TRN1 OR TRANSACTION=TRN2",
          },
        },
        { request: { action: { $: { name: "ENABLE" } } } }
      );
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      expect(error.cicsExtensionError.resourceName).toBe(expectedResourceName);
      // Verify both transaction names were extracted
      expectedNames.forEach(name => {
        expect(error.cicsExtensionError.resourceName).toContain(name);
      });
    }
  });

  it("should handle malformed criteria without equals sign", async () => {
    const errorToThrow = new Error("Test error");
    getResourceMock.mockRejectedValue(errorToThrow);

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
        params: {
          criteria: "PROGRAM",
        },
      });
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      // Should handle gracefully when no "=" is found - returns empty string
      expect(error.cicsExtensionError.resourceName).toBe("");
    }
  });

  it("should handle criteria with empty parts after split", async () => {
    const errorToThrow = new Error("Test error");
    getResourceMock.mockRejectedValue(errorToThrow);

    try {
      await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
        params: {
          criteria: "PROGRAM= OR PROGRAM=",
        },
      });
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.cicsExtensionError).toBeDefined();
      // Should filter out empty parts - returns empty string when all parts are empty
      expect(error.cicsExtensionError.resourceName).toBe("");
    }
  });
});
