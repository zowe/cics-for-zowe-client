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

import { closeLocalFile, openLocalFile, enableLocalFile, type ICMCIApiResponse, type ILocalFileParms } from "@zowe/cics-for-zowe-sdk";
import { type AbstractSession, type IHandlerParameters, type ITaskWithStatus, TaskStage } from "@zowe/imperative";
import { CicsBaseHandler } from "../CicsBaseHandler";

import type i18nTypings from "../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const closeStrings = (require("../-strings-/en").default as typeof i18nTypings).CLOSE.RESOURCES.LOCALFILE;
const openStrings = (require("../-strings-/en").default as typeof i18nTypings).OPEN.RESOURCES.LOCALFILE;
const enableStrings = (require("../-strings-/en").default as typeof i18nTypings).ENABLE.RESOURCES.LOCALFILE;

/**
 * Unified command handler for opening, closing, and enabling CICS local files via CMCI.
 * Determines the action (open/close/enable) based on the command definition's parent.
 * 
 * @export
 * @class LocalFileHandler
 * @extends {CicsBaseHandler}
 */
export default class LocalFileHandler extends CicsBaseHandler {
  /**
   * Determines the action type based on the command chain
   * @param {IHandlerParameters} params - Command handler parameters
   * @returns {"CLOSE" | "OPEN"} The action type
   */
  private getActionType(params: IHandlerParameters): "CLOSE" | "OPEN" | "ENABLE" {
    // Check parent command name first (works in tests)
    const parentCommand = params.definition.parent?.name;
    if (parentCommand === "close") {
      return "CLOSE";
    } else if (parentCommand === "open") {
      return "OPEN";
    } else if (parentCommand === "enable") {
      return "ENABLE";
    }
    
    // Check positionals array which contains the command chain
    const positionals = params.positionals || [];
    if (positionals.includes("close")) {
      return "CLOSE";
    } else if (positionals.includes("open")) {
      return "OPEN";
    } else if (positionals.includes("enable")) {
      return "ENABLE";
    }
    
    // Last resort: check if handler path contains close, open, or enable
    const handlerPath = params.definition.handler || "";
    if (handlerPath.includes("/close/") || handlerPath.includes("\\close\\")) {
      return "CLOSE";
    } else if (handlerPath.includes("/open/") || handlerPath.includes("\\open\\")) {
      return "OPEN";
    } else if (handlerPath.includes("/enable/") || handlerPath.includes("\\enable\\")) {
      return "ENABLE";
    }
    
    // Should not reach here with proper command structure
    throw new Error("Unable to determine action type from command context");
  }

  /**
   * Gets the appropriate strings based on action type
   * @param {"CLOSE" | "OPEN"} action - The action type
   * @returns {object} The strings object for the action
   */
  private getStrings(action: "CLOSE" | "OPEN" | "ENABLE") {
    if (action === "CLOSE") {
      return closeStrings;
    } else if (action === "OPEN") {
      return openStrings;
    } else {
      return enableStrings;
    }
  }

  /**
   * Process the command to open or close a CICS local file
   * @param {IHandlerParameters} params - Command handler parameters
   * @param {AbstractSession} session - The session to use for the CMCI request
   * @returns {Promise<ICMCIApiResponse>} The CMCI API response
   * @throws {ImperativeError} Various errors from validation or CMCI request failures
   */
  public async processWithSession(params: IHandlerParameters, session: AbstractSession): Promise<ICMCIApiResponse> {
    const action = this.getActionType(params);
    const strings = this.getStrings(action);
    
    const status: ITaskWithStatus = {
      statusMessage: strings.MESSAGES.PROGRESS,
      percentComplete: 0,
      stageName: TaskStage.IN_PROGRESS,
    };
    params.response.progress.startBar({ task: status });

    // Build parameters for the SDK call
    const sdkParams: ILocalFileParms = {
      name: params.arguments.fileName,
      regionName: params.arguments.regionName,
      cicsPlex: params.arguments.cicsPlex,
    };

    // Add busy parameter only for CLOSE action
    if (action === "CLOSE" && params.arguments.busy) {
      sdkParams.busy = params.arguments.busy;
    }

    // Call the appropriate SDK function based on action
    let response: ICMCIApiResponse;
    if (action === "CLOSE") {
      response = await closeLocalFile(session, sdkParams);
    } else if (action === "OPEN") {
      response = await openLocalFile(session, sdkParams);
    } else {
      response = await enableLocalFile(session, sdkParams);
    }

    params.response.console.log(strings.MESSAGES.SUCCESS, params.arguments.fileName);
    return response;
  }
}