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

import { CicsCmciRestError, ICMCIApiResponse, ICMCIResponseResultSummary } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { CICSExtensionError } from "../../../src/errors/CICSExtensionError";

function trimLineBreaks(msg: string | undefined) {
  if (!msg) return "";
  return msg.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

const resultSummaryMock: ICMCIResponseResultSummary = {
  api_response1: "1038",
  api_response2: "",
  recordcount: "",
  displayed_recordcount: "",
  api_function: "PERFORM SET",
};
let baseErrorMock: CicsCmciRestError | imperative.RestClientError | CICSExtensionError;
let cmciErrorResponseMock: ICMCIApiResponse;

describe("Test suite for CICSExtensionError", () => {
  let sut: CICSExtensionError;

  it("should return error message when error is instance of CicsCmciRestError with feedback present", () => {
    cmciErrorResponseMock = {
      response: {
        resultsummary: resultSummaryMock,
        records: [],
        errors: {
          feedback: {
            eibfn_alt: "SET Program",
            resp: "16",
            resp_alt: "INVREQ",
            resp2: "6",
            action: "Disable",
          },
        },
      },
    };
    baseErrorMock = new CicsCmciRestError("error", cmciErrorResponseMock);

    sut = new CICSExtensionError({
      baseError: baseErrorMock,
      resourceName: "MyProg",
      profileName: "myprof",
    });

    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toBe(
      "Failed to Disable PROGRAM MyProg on profile myprof with API: PERFORM SET, RESP: 16 (INVREQ) and RESP2: 6."
    );
  });

  it("should return error message when error is instance of CicsCmciRestError with feedback not present", () => {
    cmciErrorResponseMock = {
      response: {
        resultsummary: {
          api_response1: "1038",
          api_response2: "TABLEERROR",
          recordcount: "",
          displayed_recordcount: "",
          api_function: "GET",
        },
        records: [],
      },
    };
    baseErrorMock = new CicsCmciRestError("error", cmciErrorResponseMock);

    baseErrorMock.resultSummary = {
      api_response1: "1038",
      api_response2: "1038",
      api_response1_alt: "NODATA",
      api_response2_alt: "TABLEERROR",
      api_function: "GET",
      recordcount: "",
      displayed_recordcount: "",
    };
    sut = new CICSExtensionError({
      baseError: baseErrorMock,
      resourceName: "MyProg",
      profileName: "myprof",
    });

    // Updated to match new detailed error format with profile name and resource name
    const errorMessage = trimLineBreaks(sut.cicsExtensionError.errorMessage);
    expect(errorMessage).toContain("The request failed on profile myprof for resources: MyProg");
    expect(errorMessage).toContain("API_FUNCTION: GET");
    expect(errorMessage).toContain("RESP: 1038 (NODATA)");
    expect(errorMessage).toContain("RESP2: 1038 (TABLEERROR)");
    expect(errorMessage).toContain("Please refer to the [IBM documentation]");
  });

  it("should return error message when error is instance of RestClientError", () => {
    baseErrorMock = new imperative.RestClientError({
      httpStatus: 401,
      msg: "The username or password is incorrect",
      source: "http",
      resource: "localhost:8080/login/",
    });

    sut = new CICSExtensionError({
      baseError: baseErrorMock,
      profileName: "myprof",
    });

    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toBe(
      "Failed to send request on profile myprof. Response details - URL: localhost:8080/login/, Message: The username or password is incorrect"
    );
  });

  it("should return error message when error is instance of Error", () => {
    const error: Error = {
      message: "The request could not be completed due to an error",
      cause: "NullPointerException",
      name: "",
    };

    sut = new CICSExtensionError({
      baseError: error,
      profileName: "myprof",
    });

    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toBe(
      "The request on profile myprof failed. Error message: The request could not be completed due to an error, Cause: NullPointerException"
    );
  });

  it("should return error message when error is instance of RestClientError with errorCode", () => {
    baseErrorMock = new imperative.RestClientError({
      httpStatus: 500,
      msg: "Internal server error",
      source: "http",
      resource: "localhost:8080/api/",
      errorCode: "500",
    });

    sut = new CICSExtensionError({
      baseError: baseErrorMock,
      profileName: "myprof",
    });

    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toContain("Status code: 500");
    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toContain("localhost:8080/api/");
  });

  it("should handle CICSExtensionError as baseError", () => {
    // First create an inner error with specific properties
    const innerBaseError = new Error("Inner error");
    const innerError = new CICSExtensionError({
      baseError: innerBaseError,
      profileName: "innerprof",
    });
    
    // Manually set the properties that would be set by parseError
    innerError.cicsExtensionError.errorMessage = "Inner error message";
    innerError.cicsExtensionError.statusCode = 404;
    innerError.cicsExtensionError.resp1Code = 16;
    innerError.cicsExtensionError.resp2Code = 6;
    innerError.cicsExtensionError.stackTrace = "Inner stack trace";

    // Now create outer error with inner error as base
    sut = new CICSExtensionError({
      baseError: innerError,
      profileName: "outerprof",
    });

    // The outer error should copy properties from inner error
    expect(sut.cicsExtensionError.errorMessage).toBe("Inner error message");
    expect(sut.cicsExtensionError.statusCode).toBe(404);
    expect(sut.cicsExtensionError.resp1Code).toBe(16);
    expect(sut.cicsExtensionError.resp2Code).toBe(6);
    expect(sut.cicsExtensionError.stackTrace).toBe("Inner stack trace");
  });

  describe("formatDetailedErrorMessage", () => {
    it("should format message with profile name and resource name", () => {
      const resultSummary = {
        api_function: "GET",
        api_response1: "1031",
        api_response1_alt: "NOTPERMIT",
        api_response2: "0",
        api_response2_alt: "USRID",
        recordcount: "5",
        displayed_recordcount: "5"
      };

      const message = CICSExtensionError.formatDetailedErrorMessage(
        resultSummary,
        "MYPROF",
        "PROG1"
      );

      expect(message).toContain("The request failed on profile MYPROF");
      expect(message).toContain("for resources: PROG1");
      expect(message).toContain("API_FUNCTION: GET");
      expect(message).toContain("RESP: 1031 (NOTPERMIT)");
      expect(message).toContain("RESP2: 0 (USRID)");
    });

    it("should format message with profile name only", () => {
      const resultSummary = {
        api_function: "GET",
        api_response1: "1031",
        api_response1_alt: "NOTPERMIT",
        api_response2: "0",
        api_response2_alt: "USRID",
        recordcount: "5",
        displayed_recordcount: "5"
      };

      const message = CICSExtensionError.formatDetailedErrorMessage(
        resultSummary,
        "MYPROF"
      );

      expect(message).toContain("The request failed on profile MYPROF");
      expect(message).not.toContain("for resources:");
      expect(message).toContain("API_FUNCTION: GET");
      expect(message).toContain("RESP: 1031 (NOTPERMIT)");
      expect(message).toContain("RESP2: 0 (USRID)");
    });

    it("should format message without profile name", () => {
      const resultSummary = {
        api_function: "GET",
        api_response1: "1031",
        api_response1_alt: "NOTPERMIT",
        api_response2: "0",
        api_response2_alt: "USRID",
        recordcount: "5",
        displayed_recordcount: "5"
      };

      const message = CICSExtensionError.formatDetailedErrorMessage(resultSummary);

      expect(message).toContain("The request failed");
      expect(message).not.toContain("on profile");
      expect(message).toContain("API_FUNCTION: GET");
      expect(message).toContain("RESP: 1031 (NOTPERMIT)");
      expect(message).toContain("RESP2: 0 (USRID)");
    });
  });
});
