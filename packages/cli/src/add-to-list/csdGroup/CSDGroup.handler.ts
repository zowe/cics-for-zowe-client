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

import { ICMCIApiResponse, addCSDGroupToList } from "@zowe/cics-for-zowe-sdk";
import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { CicsBaseHandler } from "../../CicsBaseHandler";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).ADDTOLIST.RESOURCES.CSDGROUP;

/**
 * Command handler for adding CICS CSD Groups to CSD Lists via CMCI
 * @export
 * @class CSDGroupHandler
 * @implements {ICommandHandler}
 */
export default class CSDGroupHandler extends CicsBaseHandler {
  public async processWithSession(params: IHandlerParameters, session: AbstractSession): Promise<ICMCIApiResponse> {
    const status: ITaskWithStatus = {
      statusMessage: "Adding CSD Group to CSD List on CICS",
      percentComplete: 0,
      stageName: TaskStage.IN_PROGRESS,
    };
    params.response.progress.startBar({ task: status });

    const response = await addCSDGroupToList(session, {
      name: params.arguments.name,
      csdList: params.arguments.csdList,
      regionName: params.arguments.regionName,
      cicsPlex: params.arguments.cicsPlex,
    });

    params.response.console.log(strings.MESSAGES.SUCCESS, params.arguments.name, params.arguments.csdList);
    return response;
  }
}
