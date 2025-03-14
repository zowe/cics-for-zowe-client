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

import { extensions, l10n, LogLevel, LogOutputChannel, window } from "vscode";
import { Gui } from "@zowe/zowe-explorer-api";

export class CICSLogger {
    private logOutputChannel: LogOutputChannel;
    private static _instance: CICSLogger;

    public static get Instance() {
      return this._instance || (this._instance = new this());
    }

    private constructor() {
      try {
        this.logOutputChannel = window.createOutputChannel(l10n.t("CICS for Zowe Explorer"), { log: true } )

        this.info(l10n.t("Initialized logger for IBM CICS for Zowe Explorer"));

        const packageJSON = extensions.getExtension("zowe.cics-extension-for-zowe").packageJSON

        this.info(`${packageJSON.displayName as string} ${packageJSON.version as string}`);
        this.info(
          l10n.t({
              message: "IBM CICS for Zowe Explorer log level: {0}",
              args: [LogLevel[this.logOutputChannel.logLevel]],
              comment: ["Log level"],
          })
        );
      } catch (err) {
          // Don't log error if logger failed to initialize
          if (err instanceof Error) {
              const errorMessage = l10n.t("Error encountered while activating and initializing logger");
              Gui.errorMessage(`${errorMessage}: ${err.message}`);
          }
      }
    }

    public trace(message: string): void {
      this.logOutputChannel.trace(message);
    }

    public debug(message: string): void {
      this.logOutputChannel.debug(message);
    }

    public info(message: string): void {
      this.logOutputChannel.info(message);
    }

    public warn(message: string): void {
      this.logOutputChannel.warn(message);
    }

    public error(message: string): void {
      this.logOutputChannel.error(message);
    }

    public fatal(message: string): void {
      this.logOutputChannel.error(message);
    }

    public dispose(): void {
      this.logOutputChannel.dispose();
    }
}
