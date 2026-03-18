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

import { CicsCmciRestError, type ICMCIApiResponse } from "../../src";
import type { ICMCIResponseErrors } from "../../src/doc/ICMCIResponseErrors";
import type { ICMCIResponseErrorFeedBack } from "../../src/doc/ICMCIResponseErrorFeedBack";

describe("CicsCmciRestError tests", () => {
  const EXPECTED_API_RESPONSE_1 = 1024;
  const EXPECTED_API_RESPONSE_2 = 512;
  const EXPECTED_FEEDBACKRESP = 100;
  const EXPECTED_FEEDBACKRESP_2 = 200;
  const DEFAULT_RESP_CODE = 0;

  it("should create error with full feedback information", () => {
    const feedback: ICMCIResponseErrorFeedBack = {
      resp: String(EXPECTED_FEEDBACKRESP),
      resp2: String(EXPECTED_FEEDBACKRESP_2),
      action: "CREATE",
      resp_alt: "RESP_ALT",
      eibfn_alt: "EIBFN_ALT",
      eyu_cicsname: "CICS1",
      eibfn: "0x0001",
    };

    const errors: ICMCIResponseErrors = {
      feedback: feedback,
    };

    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
        errors: errors,
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.message).toBe("Test error message");
    expect(error.RESPONSE_1).toBe(EXPECTED_API_RESPONSE_1);
    expect(error.RESPONSE_2).toBe(EXPECTED_API_RESPONSE_2);
    expect(error.RESPONSE_1_ALT).toBe("RESPONSE1_ALT");
    expect(error.RESPONSE_2_ALT).toBe("RESPONSE2_ALT");
    expect(error.FEEDBACKRESP).toBe(EXPECTED_FEEDBACKRESP);
    expect(error.FEEDBACKRESP_2).toBe(EXPECTED_FEEDBACKRESP_2);
    expect(error.FEEDBACK_ACTION).toBe("CREATE");
    expect(error.FEEDBACKRESP_ALT).toBe("RESP_ALT");
    expect(error.EIBFN_ALT).toBe("EIBFN_ALT");
  });

  it("should handle missing errors object", () => {
    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.message).toBe("Test error message");
    expect(error.RESPONSE_1).toBe(EXPECTED_API_RESPONSE_1);
    expect(error.RESPONSE_2).toBe(EXPECTED_API_RESPONSE_2);
    expect(error.FEEDBACKRESP).toBe(DEFAULT_RESP_CODE);
    expect(error.FEEDBACKRESP_2).toBe(DEFAULT_RESP_CODE);
    expect(error.FEEDBACK_ACTION).toBeUndefined();
    expect(error.FEEDBACKRESP_ALT).toBeUndefined();
    expect(error.EIBFN_ALT).toBeUndefined();
  });

  it("should handle missing feedback object", () => {
    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
        errors: {} as any,
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.message).toBe("Test error message");
    expect(error.FEEDBACKRESP).toBe(DEFAULT_RESP_CODE);
    expect(error.FEEDBACKRESP_2).toBe(DEFAULT_RESP_CODE);
    expect(error.FEEDBACK_ACTION).toBeUndefined();
    expect(error.FEEDBACKRESP_ALT).toBeUndefined();
    expect(error.EIBFN_ALT).toBeUndefined();
  });

  it("should handle missing resp in feedback", () => {
    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
        errors: {
          feedback: {
            action: "CREATE",
            resp_alt: "RESP_ALT",
            eibfn_alt: "EIBFN_ALT",
            eyu_cicsname: "CICS1",
            eibfn: "0x0001",
          } as any,
        },
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.FEEDBACKRESP).toBe(DEFAULT_RESP_CODE);
    expect(error.FEEDBACKRESP_2).toBe(DEFAULT_RESP_CODE);
    expect(error.FEEDBACK_ACTION).toBe("CREATE");
    expect(error.FEEDBACKRESP_ALT).toBe("RESP_ALT");
    expect(error.EIBFN_ALT).toBe("EIBFN_ALT");
  });

  it("should handle missing resp2 in feedback", () => {
    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
        errors: {
          feedback: {
            resp: String(EXPECTED_FEEDBACKRESP),
            action: "CREATE",
            resp_alt: "RESP_ALT",
            eibfn_alt: "EIBFN_ALT",
            eyu_cicsname: "CICS1",
            eibfn: "0x0001",
          } as any,
        },
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.FEEDBACKRESP).toBe(EXPECTED_FEEDBACKRESP);
    expect(error.FEEDBACKRESP_2).toBe(DEFAULT_RESP_CODE);
    expect(error.FEEDBACK_ACTION).toBe("CREATE");
  });

  it("should handle missing action in feedback", () => {
    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
        errors: {
          feedback: {
            resp: String(EXPECTED_FEEDBACKRESP),
            resp2: String(EXPECTED_FEEDBACKRESP_2),
            resp_alt: "RESP_ALT",
            eibfn_alt: "EIBFN_ALT",
            eyu_cicsname: "CICS1",
            eibfn: "0x0001",
          } as any,
        },
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.FEEDBACKRESP).toBe(EXPECTED_FEEDBACKRESP);
    expect(error.FEEDBACKRESP_2).toBe(EXPECTED_FEEDBACKRESP_2);
    expect(error.FEEDBACK_ACTION).toBeUndefined();
    expect(error.FEEDBACKRESP_ALT).toBe("RESP_ALT");
    expect(error.EIBFN_ALT).toBe("EIBFN_ALT");
  });

  it("should handle missing resp_alt in feedback", () => {
    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
        errors: {
          feedback: {
            resp: String(EXPECTED_FEEDBACKRESP),
            resp2: String(EXPECTED_FEEDBACKRESP_2),
            action: "CREATE",
            eibfn_alt: "EIBFN_ALT",
            eyu_cicsname: "CICS1",
            eibfn: "0x0001",
          } as any,
        },
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.FEEDBACKRESP).toBe(EXPECTED_FEEDBACKRESP);
    expect(error.FEEDBACKRESP_2).toBe(EXPECTED_FEEDBACKRESP_2);
    expect(error.FEEDBACK_ACTION).toBe("CREATE");
    expect(error.FEEDBACKRESP_ALT).toBeUndefined();
    expect(error.EIBFN_ALT).toBe("EIBFN_ALT");
  });

  it("should handle missing eibfn_alt in feedback", () => {
    const response = {
      response: {
        resultsummary: {
          api_response1: String(EXPECTED_API_RESPONSE_1),
          api_response2: String(EXPECTED_API_RESPONSE_2),
          api_response1_alt: "RESPONSE1_ALT",
          api_response2_alt: "RESPONSE2_ALT",
        },
        errors: {
          feedback: {
            resp: String(EXPECTED_FEEDBACKRESP),
            resp2: String(EXPECTED_FEEDBACKRESP_2),
            action: "CREATE",
            resp_alt: "RESP_ALT",
            eyu_cicsname: "CICS1",
            eibfn: "0x0001",
          } as any,
        },
      },
    } as ICMCIApiResponse;

    const error = new CicsCmciRestError("Test error message", response);

    expect(error.FEEDBACKRESP).toBe(EXPECTED_FEEDBACKRESP);
    expect(error.FEEDBACKRESP_2).toBe(EXPECTED_FEEDBACKRESP_2);
    expect(error.FEEDBACK_ACTION).toBe("CREATE");
    expect(error.FEEDBACKRESP_ALT).toBe("RESP_ALT");
    expect(error.EIBFN_ALT).toBeUndefined();
  });
});