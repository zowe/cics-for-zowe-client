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

import { ICMCIApiResponse, installTransaction } from "@zowe/cics-for-zowe-sdk";
import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { CicsBaseHandler } from "../../CicsBaseHandler";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).INSTALL.RESOURCES.TRANSACTION;

/**
 * Command handler for installing CICS transactions via CMCI
 * @export
 * @class TransactionHandler
 * @implements {ICommandHandler}
 */
export default class TransactionHandler extends CicsBaseHandler {
  public async processWithSession(params: IHandlerParameters, session: AbstractSession): Promise<ICMCIApiResponse> {
    const status: ITaskWithStatus = {
      statusMessage: "Installing transaction to CICS",
      percentComplete: 0,
      stageName: TaskStage.IN_PROGRESS,
    };
    params.response.progress.startBar({ task: status });

    const response = await installTransaction(session, {
      name: params.arguments.transactionName,
      csdGroup: params.arguments.csdGroup,
      regionName: params.arguments.regionName,
      cicsPlex: params.arguments.cicsPlex,
    });

    params.response.console.log(strings.MESSAGES.SUCCESS, params.arguments.transactionName);
    return response;
  }
}
