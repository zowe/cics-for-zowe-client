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

import type {
  ICMCIApiResponse,
  ICMCIResponseResultSummary,
  ICMCIResponseErrorFeedBack,
  ICMCIResponseErrors,
} from "../../../src/doc";

describe("Doc Interface Tests", () => {
  describe("ICMCIApiResponse", () => {
    it("should accept a valid CMCI API response with all required fields", () => {
      const validResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1024",
            api_response2: "0",
            recordcount: "1",
            displayed_recordcount: "1",
          },
          records: {
            program: {
              name: "TESTPROG",
            },
          },
        },
      };

      expect(validResponse.response.resultsummary).toBeDefined();
      expect(validResponse.response.records).toBeDefined();
      expect(validResponse.response.resultsummary.api_response1).toBe("1024");
    });

    it("should accept a response with optional errors field", () => {
      const responseWithErrors: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1028",
            api_response2: "0",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: {
              eibfn_alt: "GET",
              resp: "16",
              resp_alt: "NOTFND",
              resp2: "1",
            },
          },
        },
      };

      expect(responseWithErrors.response.errors).toBeDefined();
      expect(responseWithErrors.response.errors?.feedback).toBeDefined();
    });

    it("should accept a response without optional errors field", () => {
      const responseWithoutErrors: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1024",
            api_response2: "0",
            recordcount: "5",
            displayed_recordcount: "5",
          },
          records: {
            transaction: [
              { name: "TRN1" },
              { name: "TRN2" },
            ],
          },
        },
      };

      expect(responseWithoutErrors.response.errors).toBeUndefined();
      expect(responseWithoutErrors.response.resultsummary).toBeDefined();
    });

    it("should accept records as any type", () => {
      const responseWithVariousRecords: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1024",
            api_response2: "0",
            recordcount: "3",
            displayed_recordcount: "3",
          },
          records: {
            program: [
              { name: "PROG1", status: "ENABLED" },
              { name: "PROG2", status: "DISABLED" },
            ],
          },
        },
      };

      expect(responseWithVariousRecords.response.records.program).toHaveLength(2);
    });
  });

  describe("ICMCIResponseResultSummary", () => {
    it("should accept a result summary with all required fields", () => {
      const resultSummary: ICMCIResponseResultSummary = {
        api_response1: "1024",
        api_response2: "0",
        recordcount: "10",
        displayed_recordcount: "10",
      };

      expect(resultSummary.api_response1).toBe("1024");
      expect(resultSummary.api_response2).toBe("0");
      expect(resultSummary.recordcount).toBe("10");
      expect(resultSummary.displayed_recordcount).toBe("10");
    });

    it("should accept a result summary with all optional fields", () => {
      const fullResultSummary: ICMCIResponseResultSummary = {
        _source: "CICSRGN1",
        api_function: "INQUIRE",
        api_response1: "1024",
        api_response1_alt: "OK",
        api_response2: "0",
        api_response2_alt: "SUCCESS",
        recordcount: "5",
        displayed_recordcount: "5",
        successcount: "5",
        cachetoken: "ABC123XYZ",
      };

      expect(fullResultSummary._source).toBe("CICSRGN1");
      expect(fullResultSummary.api_function).toBe("INQUIRE");
      expect(fullResultSummary.api_response1_alt).toBe("OK");
      expect(fullResultSummary.api_response2_alt).toBe("SUCCESS");
      expect(fullResultSummary.successcount).toBe("5");
      expect(fullResultSummary.cachetoken).toBe("ABC123XYZ");
    });

    it("should accept a result summary without optional fields", () => {
      const minimalResultSummary: ICMCIResponseResultSummary = {
        api_response1: "1027",
        api_response2: "0",
        recordcount: "0",
        displayed_recordcount: "0",
      };

      expect(minimalResultSummary._source).toBeUndefined();
      expect(minimalResultSummary.api_function).toBeUndefined();
      expect(minimalResultSummary.api_response1_alt).toBeUndefined();
      expect(minimalResultSummary.api_response2_alt).toBeUndefined();
      expect(minimalResultSummary.successcount).toBeUndefined();
      expect(minimalResultSummary.cachetoken).toBeUndefined();
    });

    it("should accept various response codes", () => {
      const responseCodes = [
        { api_response1: "1024", api_response1_alt: "OK" },
        { api_response1: "1027", api_response1_alt: "NODATA" },
        { api_response1: "1028", api_response1_alt: "INVALIDPARM" },
        { api_response1: "1034", api_response1_alt: "NOTAVAILABLE" },
        { api_response1: "1041", api_response1_alt: "INVALIDDATA" },
      ];

      responseCodes.forEach((code) => {
        const summary: ICMCIResponseResultSummary = {
          api_response1: code.api_response1,
          api_response1_alt: code.api_response1_alt,
          api_response2: "0",
          recordcount: "0",
          displayed_recordcount: "0",
        };

        expect(summary.api_response1).toBe(code.api_response1);
        expect(summary.api_response1_alt).toBe(code.api_response1_alt);
      });
    });
  });

  describe("ICMCIResponseErrorFeedBack", () => {
    it("should accept feedback with all required fields", () => {
      const feedback: ICMCIResponseErrorFeedBack = {
        eibfn_alt: "GET",
        resp: "16",
        resp_alt: "NOTFND",
        resp2: "1",
      };

      expect(feedback.eibfn_alt).toBe("GET");
      expect(feedback.resp).toBe("16");
      expect(feedback.resp_alt).toBe("NOTFND");
      expect(feedback.resp2).toBe("1");
    });

    it("should accept feedback with all optional fields", () => {
      const fullFeedback: ICMCIResponseErrorFeedBack = {
        eyu_cicsname: "CICSRGN1",
        action: "RETRY",
        eibfn: "0x0602",
        eibfn_alt: "INQUIRE",
        resp: "12",
        resp_alt: "NOTAUTH",
        resp2: "100",
      };

      expect(fullFeedback.eyu_cicsname).toBe("CICSRGN1");
      expect(fullFeedback.action).toBe("RETRY");
      expect(fullFeedback.eibfn).toBe("0x0602");
      expect(fullFeedback.eibfn_alt).toBe("INQUIRE");
      expect(fullFeedback.resp).toBe("12");
      expect(fullFeedback.resp_alt).toBe("NOTAUTH");
      expect(fullFeedback.resp2).toBe("100");
    });

    it("should accept feedback without optional fields", () => {
      const minimalFeedback: ICMCIResponseErrorFeedBack = {
        eibfn_alt: "PUT",
        resp: "20",
        resp_alt: "INVREQ",
        resp2: "0",
      };

      expect(minimalFeedback.eyu_cicsname).toBeUndefined();
      expect(minimalFeedback.action).toBeUndefined();
      expect(minimalFeedback.eibfn).toBeUndefined();
    });

    it("should accept various CICS response codes", () => {
      const responseCodes = [
        { resp: "0", resp_alt: "NORMAL" },
        { resp: "8", resp_alt: "DISABLED" },
        { resp: "12", resp_alt: "NOTAUTH" },
        { resp: "16", resp_alt: "NOTFND" },
        { resp: "20", resp_alt: "INVREQ" },
      ];

      responseCodes.forEach((code) => {
        const feedback: ICMCIResponseErrorFeedBack = {
          eibfn_alt: "TEST",
          resp: code.resp,
          resp_alt: code.resp_alt,
          resp2: "0",
        };

        expect(feedback.resp).toBe(code.resp);
        expect(feedback.resp_alt).toBe(code.resp_alt);
      });
    });

    it("should accept various EIBFN function codes", () => {
      const functionCodes = ["GET", "PUT", "POST", "DELETE", "INQUIRE", "SET", "PERFORM"];

      functionCodes.forEach((fn) => {
        const feedback: ICMCIResponseErrorFeedBack = {
          eibfn_alt: fn,
          resp: "0",
          resp_alt: "NORMAL",
          resp2: "0",
        };

        expect(feedback.eibfn_alt).toBe(fn);
      });
    });

    it("should accept various action values", () => {
      const actions = ["RETRY", "CONTACT_ADMINISTRATOR", "CHECK_PARAMETERS", "VERIFY_RESOURCE"];

      actions.forEach((action) => {
        const feedback: ICMCIResponseErrorFeedBack = {
          action,
          eibfn_alt: "GET",
          resp: "16",
          resp_alt: "NOTFND",
          resp2: "1",
        };

        expect(feedback.action).toBe(action);
      });
    });
  });

  describe("ICMCIResponseErrors", () => {
    it("should accept errors with feedback", () => {
      const errors: ICMCIResponseErrors = {
        feedback: {
          eibfn_alt: "GET",
          resp: "16",
          resp_alt: "NOTFND",
          resp2: "1",
        },
      };

      expect(errors.feedback).toBeDefined();
      expect(errors.feedback.resp).toBe("16");
    });

    it("should accept errors with complete feedback information", () => {
      const completeErrors: ICMCIResponseErrors = {
        feedback: {
          eyu_cicsname: "CICSRGN1",
          action: "CONTACT_ADMINISTRATOR",
          eibfn: "0x0602",
          eibfn_alt: "INQUIRE",
          resp: "12",
          resp_alt: "NOTAUTH",
          resp2: "100",
        },
      };

      expect(completeErrors.feedback.eyu_cicsname).toBe("CICSRGN1");
      expect(completeErrors.feedback.action).toBe("CONTACT_ADMINISTRATOR");
      expect(completeErrors.feedback.eibfn).toBe("0x0602");
    });

    it("should accept errors with minimal feedback", () => {
      const minimalErrors: ICMCIResponseErrors = {
        feedback: {
          eibfn_alt: "DELETE",
          resp: "20",
          resp_alt: "INVREQ",
          resp2: "0",
        },
      };

      expect(minimalErrors.feedback.eibfn_alt).toBe("DELETE");
      expect(minimalErrors.feedback.resp).toBe("20");
    });
  });

  describe("Type Guard Functions", () => {
    function isICMCIApiResponse(obj: any): obj is ICMCIApiResponse {
      return (
        obj !== null &&
        obj !== undefined &&
        typeof obj === "object" &&
        "response" in obj &&
        obj.response &&
        "resultsummary" in obj.response &&
        "records" in obj.response
      );
    }

    function isICMCIResponseResultSummary(obj: any): obj is ICMCIResponseResultSummary {
      return (
        obj &&
        typeof obj === "object" &&
        "api_response1" in obj &&
        "api_response2" in obj &&
        "recordcount" in obj &&
        "displayed_recordcount" in obj
      );
    }

    function isICMCIResponseErrorFeedBack(obj: any): obj is ICMCIResponseErrorFeedBack {
      return (
        obj &&
        typeof obj === "object" &&
        "eibfn_alt" in obj &&
        "resp" in obj &&
        "resp_alt" in obj &&
        "resp2" in obj
      );
    }

    function isICMCIResponseErrors(obj: any): obj is ICMCIResponseErrors {
      return obj && typeof obj === "object" && "feedback" in obj && isICMCIResponseErrorFeedBack(obj.feedback);
    }

    it("should validate ICMCIApiResponse with type guard", () => {
      const validResponse = {
        response: {
          resultsummary: {
            api_response1: "1024",
            api_response2: "0",
            recordcount: "1",
            displayed_recordcount: "1",
          },
          records: {},
        },
      };

      expect(isICMCIApiResponse(validResponse)).toBe(true);
      expect(isICMCIApiResponse({})).toBe(false);
      expect(isICMCIApiResponse(null)).toBe(false);
      expect(isICMCIApiResponse(undefined)).toBe(false);
    });

    it("should validate ICMCIResponseResultSummary with type guard", () => {
      const validSummary = {
        api_response1: "1024",
        api_response2: "0",
        recordcount: "1",
        displayed_recordcount: "1",
      };

      expect(isICMCIResponseResultSummary(validSummary)).toBe(true);
      expect(isICMCIResponseResultSummary({})).toBe(false);
      expect(isICMCIResponseResultSummary({ api_response1: "1024" })).toBe(false);
    });

    it("should validate ICMCIResponseErrorFeedBack with type guard", () => {
      const validFeedback = {
        eibfn_alt: "GET",
        resp: "16",
        resp_alt: "NOTFND",
        resp2: "1",
      };

      expect(isICMCIResponseErrorFeedBack(validFeedback)).toBe(true);
      expect(isICMCIResponseErrorFeedBack({})).toBe(false);
      expect(isICMCIResponseErrorFeedBack({ resp: "16" })).toBe(false);
    });

    it("should validate ICMCIResponseErrors with type guard", () => {
      const validErrors = {
        feedback: {
          eibfn_alt: "GET",
          resp: "16",
          resp_alt: "NOTFND",
          resp2: "1",
        },
      };

      expect(isICMCIResponseErrors(validErrors)).toBe(true);
      expect(isICMCIResponseErrors({})).toBe(false);
      expect(isICMCIResponseErrors({ feedback: {} })).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    it("should work together in a complete response scenario", () => {
      const completeResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            _source: "CICSRGN1",
            api_function: "INQUIRE",
            api_response1: "1024",
            api_response1_alt: "OK",
            api_response2: "0",
            api_response2_alt: "SUCCESS",
            recordcount: "3",
            displayed_recordcount: "3",
            successcount: "3",
          },
          records: {
            program: [
              { name: "PROG1", status: "ENABLED" },
              { name: "PROG2", status: "DISABLED" },
              { name: "PROG3", status: "ENABLED" },
            ],
          },
        },
      };

      expect(completeResponse.response.resultsummary.recordcount).toBe("3");
      expect(completeResponse.response.records.program).toHaveLength(3);
    });

    it("should work together in an error response scenario", () => {
      const errorResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1028",
            api_response1_alt: "INVALIDPARM",
            api_response2: "100",
            api_response2_alt: "INVALID_PARAMETER",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: {
              eyu_cicsname: "CICSRGN1",
              action: "CHECK_PARAMETERS",
              eibfn_alt: "PUT",
              resp: "20",
              resp_alt: "INVREQ",
              resp2: "5",
            },
          },
        },
      };

      expect(errorResponse.response.errors).toBeDefined();
      expect(errorResponse.response.errors?.feedback.action).toBe("CHECK_PARAMETERS");
      expect(errorResponse.response.resultsummary.api_response1_alt).toBe("INVALIDPARM");
    });
  });
});