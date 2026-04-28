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

import { closeLocalFile, type ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { type AbstractSession, type IHandlerParameters, type ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { CicsBaseHandler } from "../../CicsBaseHandler";

import type i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).CLOSE.RESOURCES.LOCALFILE;

/**
 * Command handler for closing CICS local files via CMCI
 * @export
 * @class LocalFileHandler
 * @implements {ICommandHandler}
 */
export default class LocalFileHandler extends CicsBaseHandler {
  /**
   * Process the command to close a CICS local file
   * @param {IHandlerParameters} params - Command handler parameters
   * @param {AbstractSession} session - The session to use for the CMCI request
   * @returns {Promise<ICMCIApiResponse>} The CMCI API response
   * @throws {ImperativeError} Various errors from validation or CMCI request failures
   * @memberof LocalFileHandler
   */
  public async processWithSession(params: IHandlerParameters, session: AbstractSession): Promise<ICMCIApiResponse> {
    const status: ITaskWithStatus = {
      statusMessage: strings.MESSAGES.PROGRESS,
      percentComplete: 0,
      stageName: TaskStage.IN_PROGRESS,
    };
    params.response.progress.startBar({ task: status });

    // Error handling is managed by the base handler (CicsBaseHandler)
    // which catches and formats errors appropriately for CLI output
    const response = await closeLocalFile(session, {
      name: params.arguments.fileName,
      regionName: params.arguments.regionName,
      cicsPlex: params.arguments.cicsPlex,
      busy: params.arguments.busy,
    });

    params.response.console.log(strings.MESSAGES.SUCCESS, params.arguments.fileName);
    return response;
  }
}