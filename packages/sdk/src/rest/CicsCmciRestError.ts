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

import { ImperativeError } from "@zowe/imperative";
import { CicsCmciConstants } from "../constants";
import { ICMCIApiResponse, ICMCIResponseResultSummary } from "../doc";
import { ICMCIResponseErrors } from "../doc/ICMCIResponseErrors";

export class CicsCmciRestError extends ImperativeError {
  resultSummary: ICMCIResponseResultSummary;
  errors: ICMCIResponseErrors;

  RESPONSE_1: number;
  RESPONSE_2: number;
  RESPONSE_1_ALT: string;
  RESPONSE_2_ALT: string;
  FEEDBACKRESP: number;
  FEEDBACKRESP_2: number;
  FEEDBACK_ACTION: string;
  EIBFN_ALT: string;
  FEEDBACKRESP_ALT: string;

  constructor(msg: string, response: ICMCIApiResponse) {
    super({ msg });
    this.resultSummary = response.response.resultsummary;
    this.errors = response.response.errors;
    this.parseResultSummary();
  }

  parseResultSummary() {
    this.RESPONSE_1 = parseInt(this.resultSummary.api_response1);
    this.RESPONSE_2 = parseInt(this.resultSummary.api_response2);
    this.RESPONSE_1_ALT = this.resultSummary.api_response1_alt;
    this.RESPONSE_2_ALT = this.resultSummary.api_response2_alt;
    this.FEEDBACKRESP = parseInt(this.errors?.feedback?.resp || CicsCmciConstants.DEFAULT_RESP_CODE);
    this.FEEDBACKRESP_2 = parseInt(this.errors?.feedback?.resp2 || CicsCmciConstants.DEFAULT_RESP_CODE);
    this.FEEDBACK_ACTION = this.errors?.feedback?.action;
    this.FEEDBACKRESP_ALT = this.errors?.feedback?.resp_alt;
    this.EIBFN_ALT = this.errors?.feedback?.eibfn_alt;
  }
}
