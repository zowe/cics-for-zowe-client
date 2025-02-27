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

export class CicsCmciRestError extends ImperativeError {
  resultSummary: ICMCIResponseResultSummary;

  RESPONSE_1: number;
  RESPONSE_2: number;
  RESPONSE_1_ALT: string;
  RESPONSE_2_ALT: string;

  constructor(msg: string, resultSummary: ICMCIResponseResultSummary) {
    super({
      msg,
    });
    this.resultSummary = resultSummary;
    this.parseResultSummary();
  }

  parseResultSummary() {
    this.RESPONSE_1 = parseInt(this.resultSummary.api_response1);
    this.RESPONSE_2 = parseInt(this.resultSummary.api_response2);
    this.RESPONSE_1_ALT = this.resultSummary.api_response1_alt;
    this.RESPONSE_2_ALT = this.resultSummary.api_response2_alt;
  }
}
