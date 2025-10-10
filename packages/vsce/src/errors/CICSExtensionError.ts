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

import { MessageItem } from "vscode";
import { CICSLogger } from "../utils/CICSLogger";
import { IError } from "./IError";
import { Gui } from "@zowe/zowe-explorer-api";

export class CICSExtensionError extends Error {
  error: IError;
  constructor(error?: IError) {
    super();
    this.error = error;
  }
}

export function notifyErrorMessage({ errorMessage, additionalInfo, action }: IError): Thenable<string | MessageItem> {
    if (additionalInfo) {
      CICSLogger.error(`${errorMessage} ${additionalInfo}`);
    } else {
      CICSLogger.error(`${errorMessage}`);
    }
    if (action) {
      return Gui.errorMessage(errorMessage, { items: [...action] });
    }
    return Gui.errorMessage(errorMessage);
  }
