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

// Test constants for response codes
const TEST_RESPONSE_CODE_512 = 512;
const TEST_RESPONSE_CODE_16 = 16;
const TEST_RESPONSE_CODE_20 = 20;
const TEST_RESPONSE_CODE_12 = 12;
const TEST_RESPONSE_CODE_100 = 100;
const TEST_RESPONSE_CODE_8 = 8;
const TEST_RESPONSE_CODE_1 = 1;

describe("CicsCmciRestError tests", () => {
  describe("Constructor and basic properties", () => {
    it("should create an error with message and response", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            api_response1_alt: "OK",
            api_response2_alt: "SUCCESS",
            recordcount: "1",
            displayed_recordcount: "1",
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

      const error = new CicsCmciRestError("Test error message", mockResponse);

      expect(error.message).toBe("Test error message");
      expect(error.resultSummary).toBe(mockResponse.response.resultsummary);
      expect(error.errors).toBe(mockResponse.response.errors);
    });

    it("should extend ImperativeError", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Test error", mockResponse);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("Error");
    });
  });

  describe("parseResultSummary method", () => {
    it("should parse api_response1 and api_response2 as integers", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "512",
            api_response1_alt: "OK",
            api_response2_alt: "RESPONSE_ALT",
            recordcount: "1",
            displayed_recordcount: "1",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Test error", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.OK);
      expect(error.RESPONSE_2).toBe(TEST_RESPONSE_CODE_512);
      expect(typeof error.RESPONSE_1).toBe("number");
      expect(typeof error.RESPONSE_2).toBe("number");
    });

    it("should parse alternative response codes", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM.toString(),
            api_response2: "100",
            api_response1_alt: "INVALIDPARM",
            api_response2_alt: "INVALID_PARAMETER",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Invalid parameter", mockResponse);

      expect(error.RESPONSE_1_ALT).toBe("INVALIDPARM");
      expect(error.RESPONSE_2_ALT).toBe("INVALID_PARAMETER");
    });

    it("should parse feedback error information when present", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: {
              eibfn_alt: "PUT",
              resp: "16",
              resp_alt: "NOTFND",
              resp2: "1",
              action: "RETRY",
            },
          },
        },
      };

      const error = new CicsCmciRestError("Feedback error", mockResponse);

      expect(error.FEEDBACKRESP).toBe(TEST_RESPONSE_CODE_16);
      expect(error.FEEDBACKRESP_2).toBe(TEST_RESPONSE_CODE_1);
      expect(error.FEEDBACKRESP_ALT).toBe("NOTFND");
      expect(error.EIBFN_ALT).toBe("PUT");
      expect(error.FEEDBACK_ACTION).toBe("RETRY");
    });

    it("should use default resp code when errors are not present", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            recordcount: "1",
            displayed_recordcount: "1",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("No errors", mockResponse);

      expect(error.FEEDBACKRESP).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
      expect(error.FEEDBACKRESP_2).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
      expect(error.FEEDBACK_ACTION).toBeUndefined();
      expect(error.FEEDBACKRESP_ALT).toBeUndefined();
      expect(error.EIBFN_ALT).toBeUndefined();
    });

    it("should use default resp code when feedback is undefined", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.NODATA.toString(),
            api_response2: "0",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: undefined as any,
          },
        },
      };

      const error = new CicsCmciRestError("No feedback", mockResponse);

      expect(error.FEEDBACKRESP).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
      expect(error.FEEDBACKRESP_2).toBe(parseInt(CicsCmciConstants.DEFAULT_RESP_CODE));
    });

    it("should handle partial feedback information", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: {
              eibfn_alt: "DELETE",
              resp: "20",
              resp_alt: "INVREQ",
              resp2: "0",
            },
          },
        },
      };

      const error = new CicsCmciRestError("Partial feedback", mockResponse);

      expect(error.FEEDBACKRESP).toBe(TEST_RESPONSE_CODE_20);
      expect(error.FEEDBACKRESP_2).toBe(0);
      expect(error.FEEDBACKRESP_ALT).toBe("INVREQ");
      expect(error.EIBFN_ALT).toBe("DELETE");
      expect(error.FEEDBACK_ACTION).toBeUndefined();
    });
  });

  describe("Error scenarios with different response codes", () => {
    it("should handle NODATA response code", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.NODATA.toString(),
            api_response2: "0",
            api_response1_alt: "NODATA",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("No data found", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.NODATA);
      expect(error.RESPONSE_1_ALT).toBe("NODATA");
    });

    it("should handle INVALIDPARM response code", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM.toString(),
            api_response2: "0",
            api_response1_alt: "INVALIDPARM",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Invalid parameter", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.INVALIDPARM);
      expect(error.RESPONSE_1_ALT).toBe("INVALIDPARM");
    });

    it("should handle NOTAVAILABLE response code", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.NOTAVAILABLE.toString(),
            api_response2: "0",
            api_response1_alt: "NOTAVAILABLE",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Resource not available", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.NOTAVAILABLE);
      expect(error.RESPONSE_1_ALT).toBe("NOTAVAILABLE");
    });

    it("should handle INVALIDDATA response code", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA.toString(),
            api_response2: "0",
            api_response1_alt: "INVALIDDATA",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Invalid data", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.INVALIDDATA);
      expect(error.RESPONSE_1_ALT).toBe("INVALIDDATA");
    });
  });

  describe("Complex error scenarios", () => {
    it("should handle error with complete feedback and CICS name", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "100",
            api_response1_alt: "OK",
            api_response2_alt: "WARNING",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: {
              eyu_cicsname: "CICSRGN1",
              action: "CONTACT_ADMINISTRATOR",
              eibfn: "0x0602",
              eibfn_alt: "INQUIRE",
              resp: "12",
              resp_alt: "NOTAUTH",
              resp2: "100",
            },
          },
        },
      };

      const error = new CicsCmciRestError("Authorization error", mockResponse);

      expect(error.FEEDBACKRESP).toBe(TEST_RESPONSE_CODE_12);
      expect(error.FEEDBACKRESP_2).toBe(TEST_RESPONSE_CODE_100);
      expect(error.FEEDBACKRESP_ALT).toBe("NOTAUTH");
      expect(error.EIBFN_ALT).toBe("INQUIRE");
      expect(error.FEEDBACK_ACTION).toBe("CONTACT_ADMINISTRATOR");
    });

    it("should handle numeric string parsing correctly", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "0001024",
            api_response2: "0000000",
            recordcount: "1",
            displayed_recordcount: "1",
          },
          records: {},
          errors: {
            feedback: {
              eibfn_alt: "GET",
              resp: "0016",
              resp_alt: "NOTFND",
              resp2: "0001",
            },
          },
        },
      };

      const error = new CicsCmciRestError("Numeric parsing test", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.OK);
      expect(error.RESPONSE_2).toBe(0);
      expect(error.FEEDBACKRESP).toBe(TEST_RESPONSE_CODE_16);
      expect(error.FEEDBACKRESP_2).toBe(TEST_RESPONSE_CODE_1);
    });

    it("should handle empty string values gracefully", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            api_response1_alt: "",
            api_response2_alt: "",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: {
              eibfn_alt: "",
              resp: "0",
              resp_alt: "",
              resp2: "0",
              action: "",
            },
          },
        },
      };

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
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "INVALID",
            api_response2: "ALSO_INVALID",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Invalid numeric test", mockResponse);

      expect(error.RESPONSE_1).toBeNaN();
      expect(error.RESPONSE_2).toBeNaN();
    });

    it("should handle missing optional fields in resultsummary", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
        },
      };

      const error = new CicsCmciRestError("Missing optional fields", mockResponse);

      expect(error.RESPONSE_1).toBe(CicsCmciConstants.RESPONSE_1_CODES.OK);
      expect(error.RESPONSE_2).toBe(0);
      expect(error.RESPONSE_1_ALT).toBeUndefined();
      expect(error.RESPONSE_2_ALT).toBeUndefined();
    });

    it("should handle error with only resp field in feedback", () => {
      const mockResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: CicsCmciConstants.RESPONSE_1_CODES.OK.toString(),
            api_response2: "0",
            recordcount: "0",
            displayed_recordcount: "0",
          },
          records: {},
          errors: {
            feedback: {
              eibfn_alt: "POST",
              resp: "8",
              resp_alt: "DISABLED",
              resp2: "0",
            },
          },
        },
      };

      const error = new CicsCmciRestError("Minimal feedback", mockResponse);

      expect(error.FEEDBACKRESP).toBe(TEST_RESPONSE_CODE_8);
      expect(error.FEEDBACKRESP_2).toBe(0);
      expect(error.FEEDBACKRESP_ALT).toBe("DISABLED");
      expect(error.EIBFN_ALT).toBe("POST");
      expect(error.FEEDBACK_ACTION).toBeUndefined();
    });
  });
});