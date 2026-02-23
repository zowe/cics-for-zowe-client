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
            profile: "myprof",
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

    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toBe(
      "The request failed on profile myprof for resources: MyProg. Response details: API_FUNCTION: GET, RESP: 1038 (NODATA), RESP2: 1038 (TABLEERROR)."
    );
  });

  it("should return error message when error is instance of RestClientError", () => {
    baseErrorMock = new imperative.RestClientError({
      httpStatus: 401,
      msg: "The username or password is incorrect",
      source: "http",
      resource: "localhost:8080/login/",
    });

    sut = new CICSExtensionError({ baseError: baseErrorMock });

    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toBe(
      "Failed to send request on profile . Response details - URL: localhost:8080/login/, Message: The username or password is incorrect"
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
    });

    expect(trimLineBreaks(sut.cicsExtensionError.errorMessage)).toBe(
      "The request failed. Error message: The request could not be completed due to an error, Cause: NullPointerException"
    );
  });
});
