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

import { AbstractSession, IHandlerParameters, IProfile, ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { ICMCIApiResponse, deleteWebservice } from "@zowe/cics-for-zowe-sdk";
import { CicsBaseHandler } from "../../CicsBaseHandler";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DELETE.RESOURCES.URIMAP;

/**
 * Command handler for deleting CICS web services via CMCI
 * @export
 * @class WebServiceHandler
 * @implements {ICommandHandler}
 */

export default class WebServiceHandler extends CicsBaseHandler {
  public async processWithSession(params: IHandlerParameters, session: AbstractSession, profile: IProfile): Promise<ICMCIApiResponse> {
    const status: ITaskWithStatus = {
      statusMessage: "Deleting web service from CICS",
      percentComplete: 0,
      stageName: TaskStage.IN_PROGRESS,
    };
    params.response.progress.startBar({ task: status });

    const response = await deleteWebservice(session, {
      name: params.arguments.webserviceName,
      csdGroup: params.arguments.csdGroup,
      regionName: params.arguments.regionName || profile.regionName,
    });

    params.response.console.log(strings.MESSAGES.SUCCESS, params.arguments.webserviceName);
    return response;
  }
}
