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

/* eslint-disable @typescript-eslint/restrict-plus-operands */

import * as vscode from "vscode";
import { Gui } from "@zowe/zowe-explorer-api";
import { LogLevel } from "vscode";

export class CicsLogger {
    private static logOutputChannel: vscode.LogOutputChannel;

    public static async initialize(context: vscode.ExtensionContext) {
        try {
            CicsLogger.logOutputChannel = vscode.window.createOutputChannel(vscode.l10n.t("CICS for Zowe Explorer"), { log: true } )

            CicsLogger.writeInitInfo(context);
        } catch (err) {
            // Don't log error if logger failed to initialize
            if (err instanceof Error) {
                const errorMessage = vscode.l10n.t("Error encountered while activating and initializing logger");
                await Gui.errorMessage(`${errorMessage}: ${err.message}`);
            }
        }
    }

    private static writeInitInfo(context: vscode.ExtensionContext): void {
      CicsLogger.info(vscode.l10n.t("Initialized logger for IBM CICS for Zowe Explorer"));
      CicsLogger.info(`${context.extension.packageJSON.displayName as string} ${context.extension.packageJSON.version as string}`);
      CicsLogger.info(
        vscode.l10n.t({
            message: "IBM CICS for Zowe Explorer log level: {0}",
            args: [LogLevel[CicsLogger.logOutputChannel.logLevel]],
            comment: ["Log level"],
        })
      );
    }

    public static trace(message: string): void {
      CicsLogger.logOutputChannel.trace(message);
    }

    public static debug(message: string): void {
      CicsLogger.logOutputChannel.debug(message);
    }

    public static info(message: string): void {
      CicsLogger.logOutputChannel.info(message);
    }

    public static warn(message: string): void {
      CicsLogger.logOutputChannel.warn(message);
    }

    public static error(message: string): void {
      CicsLogger.logOutputChannel.error(message);
    }

    public static fatal(message: string): void {
      CicsLogger.logOutputChannel.error(message);
    }

    public static dispose(): void {
      CicsLogger.logOutputChannel.dispose();
    }
}
