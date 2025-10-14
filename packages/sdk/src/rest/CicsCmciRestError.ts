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
import { ICMCIResponseResultSummary } from "../doc";
import { ICMCIResponseErrors } from "../doc/ICMCIResponseErrors";

export class CicsCmciRestError extends ImperativeError {
  resultSummary: ICMCIResponseResultSummary;

  RESPONSE_1: number;
  RESPONSE_2: number;
  RESPONSE_1_ALT: string;
  RESPONSE_2_ALT: string;
  FEEDBACKRESP: number;
  FEEDBACKRESP_2: number;
  FEEDBACK_ACTION: string
  EIBFN_ALT: string;
  FEEDBACKRESP_ALT: string;

  constructor(msg: string , resultSummary: ICMCIResponseResultSummary, errorFeedback?: ICMCIResponseErrors) {
    super({msg});
    this.resultSummary = resultSummary;
    this.resultSummary.errors = errorFeedback;
    this.parseResultSummary();
  }

  parseResultSummary() {
    this.RESPONSE_1 = parseInt(this.resultSummary.api_response1);
    this.RESPONSE_2 = parseInt(this.resultSummary.api_response2);
    this.RESPONSE_1_ALT = this.resultSummary.api_response1_alt;
    this.RESPONSE_2_ALT = this.resultSummary.api_response2_alt;
    this.FEEDBACKRESP = parseInt(this.resultSummary.errors?.feedback?.resp);
    this.FEEDBACKRESP_2 = parseInt(this.resultSummary.errors?.feedback?.resp2);
    this.FEEDBACK_ACTION = this.resultSummary.errors?.feedback?.action;
    this.FEEDBACKRESP_ALT = this.resultSummary.errors?.feedback?.resp_alt;
    this.EIBFN_ALT = this.resultSummary.errors?.feedback?.eibfn_alt
  }
}
