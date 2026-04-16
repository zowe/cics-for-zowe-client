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

import { CicsCmciRestError } from "../../src/rest/CicsCmciRestError";
import { CicsCmciConstants } from "../../src/constants/CicsCmci.constants";
import type { ICMCIApiResponse } from "../../src/doc/ICMCIApiResponse";

describe("CicsCmciRestError tests", () => {
  // Helper function to create mock responses with common structure
  const createMockResponse = (options: {
    api_response1: string;
    api_response2: string;
    api_response1_alt?: string;
    api_response2_alt?: string;
    recordcount?: string;
    displayed_recordcount?: string;
    feedback?: any;
  }): ICMCIApiResponse => {
    const response: ICMCIApiResponse = {
      response: {
        resultsummary: {
          api_response1: options.api_response1,
          api_response2: options.api_response2,
          recordcount: options.recordcount || "0",
          displayed_recordcount: options.displayed_recordcount || "0",
        },
        records: {},
      },
    };

    if (options.api_response1_alt !== undefined) {
      response.response.resultsummary.api_response1_alt = options.api_response1_alt;
    }
    if (options.api_response2_alt !== undefined) {
      response.response.resultsummary.api_response2_alt = options.api_response2_alt;
    }
    if (options.feedback !== undefined) {
      response.response.errors = {
        feedback: options.feedback,
      };
    }

    return response;
  };

  describe("Constructor and basic properties", () => {
    it("should create an error with message and response", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
        api_response1_alt: "OK",
        api_response2_alt: "SUCCESS",
        recordcount: "1",
        displayed_recordcount: "1",
        feedback: {
          eibfn_alt: "GET",
          resp: "16",
          resp_alt: "NOTFND",
          resp2: "1",
        },
      });

      const error = new CicsCmciRestError("Test error message", mockResponse);

      expect(error.message).toBe("Test error message");
      expect(error.resultSummary).toBe(mockResponse.response.resultsummary);
      expect(error.errors).toBe(mockResponse.response.errors);
    });

    it("should extend ImperativeError", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
      });

      const error = new CicsCmciRestError("Test error", mockResponse);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("Error");
    });
  });

  describe("parseResultSummary method", () => {
    it("should parse api_response1 and api_response2 as integers", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "512",
        api_response1_alt: "OK",
        api_response2_alt: "RESPONSE_ALT",
        recordcount: "1",
        displayed_recordcount: "1",
      });

      const error = new CicsCmciRestError("Test error", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.OK);
      expect(error.RESPONSE_2).toBe(512);
      expect(error.RESPONSE_1_ALT).toBe("OK");
      expect(error.RESPONSE_2_ALT).toBe("RESPONSE_ALT");
      expect(typeof error.RESPONSE_1).toBe("number");
      expect(typeof error.RESPONSE_2).toBe("number");
    });

    it("should parse alternative response codes", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM.toString(),
        api_response2: "100",
        api_response1_alt: "INVALIDPARM",
        api_response2_alt: "INVALID_PARAMETER",
      });

      const error = new CicsCmciRestError("Invalid parameter", mockResponse);

      expect(error.RESPONSE_1_ALT).toBe("INVALIDPARM");
      expect(error.RESPONSE_2_ALT).toBe("INVALID_PARAMETER");
    });

    it("should parse feedback error information when present", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
        feedback: {
          eibfn_alt: "PUT",
          resp: "16",
          resp_alt: "NOTFND",
          resp2: "1",
          action: "RETRY",
        },
      });

      const error = new CicsCmciRestError("Feedback error", mockResponse);

      expect(error.FEEDBACKRESP).toBe(16);
      expect(error.FEEDBACKRESP_2).toBe(1);
      expect(error.FEEDBACKRESP_ALT).toBe("NOTFND");
      expect(error.EIBFN_ALT).toBe("PUT");
      expect(error.FEEDBACK_ACTION).toBe("RETRY");
    });

    it("should use default resp code when errors are not present", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
        recordcount: "1",
        displayed_recordcount: "1",
      });

      const error = new CicsCmciRestError("No errors", mockResponse);

      expect(error.FEEDBACKRESP).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
      expect(error.FEEDBACKRESP_2).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
      expect(error.FEEDBACK_ACTION).toBeUndefined();
      expect(error.FEEDBACKRESP_ALT).toBeUndefined();
      expect(error.EIBFN_ALT).toBeUndefined();
    });

    it("should use default resp code when feedback is undefined", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.NODATA.toString(),
        api_response2: "0",
        feedback: undefined as any,
      });

      const error = new CicsCmciRestError("No feedback", mockResponse);

      expect(error.FEEDBACKRESP).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
      expect(error.FEEDBACKRESP_2).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
    });

    it("should handle partial feedback information", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
        feedback: {
          eibfn_alt: "DELETE",
          resp: "20",
          resp_alt: "INVREQ",
          resp2: "0",
        },
      });

      const error = new CicsCmciRestError("Partial feedback", mockResponse);

      expect(error.FEEDBACKRESP).toBe(20);
      expect(error.FEEDBACKRESP_2).toBe(0);
      expect(error.FEEDBACKRESP_ALT).toBe("INVREQ");
      expect(error.EIBFN_ALT).toBe("DELETE");
      expect(error.FEEDBACK_ACTION).toBeUndefined();
    });
  });

  describe("Error scenarios with different response codes", () => {
    // Data-driven tests for different RESPONSE_1 codes
    const responseCodeTestCases = [
      {
        code: "NODATA",
        constant: CicsCmciConstants.RESPONSE_1_CODES.NODATA,
        message: "No data found",
      },
      {
        code: "INVALIDPARM",
        constant: CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM,
        message: "Invalid parameter",
      },
      {
        code: "NOTAVAILABLE",
        constant: CicsCmciConstants.RESPONSE_1_CODES.NOTAVAILABLE,
        message: "Resource not available",
      },
      {
        code: "INVALIDDATA",
        constant: CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA,
        message: "Invalid data",
      },
    ];

    responseCodeTestCases.forEach(({ code, constant, message }) => {
      it(`should handle ${code} response code`, () => {
        const mockResponse = createMockResponse({
          api_response1: constant.toString(),
          api_response2: "0",
          api_response1_alt: code,
        });

        const error = new CicsCmciRestError(message, mockResponse);

        expect(error.RESPONSE_1).toBe(constant);
        expect(error.RESPONSE_1_ALT).toBe(code);
      });
    });
  });

  describe("Complex error scenarios", () => {
    it("should handle error with complete feedback and CICS name", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "100",
        api_response1_alt: "OK",
        api_response2_alt: "WARNING",
        feedback: {
          eyu_cicsname: "CICSRGN1",
          action: "CONTACT_ADMINISTRATOR",
          eibfn: "0x0602",
          eibfn_alt: "INQUIRE",
          resp: "12",
          resp_alt: "NOTAUTH",
          resp2: "100",
        },
      });

      const error = new CicsCmciRestError("Authorization error", mockResponse);

      expect(error.FEEDBACKRESP).toBe(12);
      expect(error.FEEDBACKRESP_2).toBe(100);
      expect(error.FEEDBACKRESP_ALT).toBe("NOTAUTH");
      expect(error.EIBFN_ALT).toBe("INQUIRE");
      expect(error.FEEDBACK_ACTION).toBe("CONTACT_ADMINISTRATOR");
    });

    it("should handle numeric string parsing correctly", () => {
      const mockResponse = createMockResponse({
        api_response1: "0001024",
        api_response2: "0000000",
        recordcount: "1",
        displayed_recordcount: "1",
        feedback: {
          eibfn_alt: "GET",
          resp: "0016",
          resp_alt: "NOTFND",
          resp2: "0001",
        },
      });

      const error = new CicsCmciRestError("Numeric parsing test", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.OK);
      expect(error.RESPONSE_2).toBe(0);
      expect(error.FEEDBACKRESP).toBe(16);
      expect(error.FEEDBACKRESP_2).toBe(1);
    });

    it("should handle empty string values gracefully", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
        api_response1_alt: "",
        api_response2_alt: "",
        feedback: {
          eibfn_alt: "",
          resp: "0",
          resp_alt: "",
          resp2: "0",
          action: "",
        },
      });

      const error = new CicsCmciRestError("Empty strings test", mockResponse);

      expect(error.RESPONSE_1_ALT).toBe("");
      expect(error.RESPONSE_2_ALT).toBe("");
      expect(error.FEEDBACKRESP_ALT).toBe("");
      expect(error.EIBFN_ALT).toBe("");
      expect(error.FEEDBACK_ACTION).toBe("");
    });
  });

  describe("Edge cases", () => {
    it("should handle NaN when parsing invalid numeric strings", () => {
      const mockResponse = createMockResponse({
        api_response1: "INVALID",
        api_response2: "ALSO_INVALID",
      });

      const error = new CicsCmciRestError("Invalid numeric test", mockResponse);

      expect(error.RESPONSE_1).toBeNaN();
      expect(error.RESPONSE_2).toBeNaN();
    });

    it("should handle missing optional fields in resultsummary", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
      });

      const error = new CicsCmciRestError("Missing optional fields", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.OK);
      expect(error.RESPONSE_2).toBe(0);
      expect(error.RESPONSE_1_ALT).toBeUndefined();
      expect(error.RESPONSE_2_ALT).toBeUndefined();
    });

    it("should handle error with only resp field in feedback", () => {
      const mockResponse = createMockResponse({
        api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
        api_response2: "0",
        feedback: {
          eibfn_alt: "POST",
          resp: "8",
          resp_alt: "DISABLED",
          resp2: "0",
        },
      });

      const error = new CicsCmciRestError("Minimal feedback", mockResponse);

      expect(error.FEEDBACKRESP).toBe(8);
      expect(error.FEEDBACKRESP_2).toBe(0);
      expect(error.FEEDBACKRESP_ALT).toBe("DISABLED");
      expect(error.EIBFN_ALT).toBe("POST");
      expect(error.FEEDBACK_ACTION).toBeUndefined();
    });
  });
});