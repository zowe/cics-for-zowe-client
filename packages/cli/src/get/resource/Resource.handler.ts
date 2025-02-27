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

import { ICMCIApiResponse, getResource } from "@zowe/cics-for-zowe-sdk";
import { AbstractSession, IHandlerParameters, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { CicsBaseHandler } from "../../CicsBaseHandler";

/**
 * Command handler for defining CICS programs via CMCI
 * @export
 * @class ProgramHandler
 * @implements {ICommandHandler}
 */
export default class ResourceHandler extends CicsBaseHandler {
  public async processWithSession(params: IHandlerParameters, session: AbstractSession): Promise<ICMCIApiResponse> {
    const status: ITaskWithStatus = {
      statusMessage: "Getting resources from CICS",
      percentComplete: 0,
      stageName: TaskStage.IN_PROGRESS,
    };
    params.response.progress.startBar({ task: status });

    const response = await getResource(session, {
      name: params.arguments.resourceName,
      regionName: params.arguments.regionName,
      cicsPlex: params.arguments.cicsPlex,
      criteria: params.arguments.criteria,
      parameter: params.arguments.parameter,
    });

    params.response.format.output({
      fields: [],
      format: "object",
      output: response.response.records[params.arguments.resourceName.toLowerCase()],
    });
    return response;
  }
}
