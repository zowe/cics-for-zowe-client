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

import { extensions, l10n, LogLevel, type LogOutputChannel, window } from "vscode";

export class CICSLogger {
  private static amInitialized = false;
  private static logOutputChannel: LogOutputChannel;

  private static initialize() {
    CICSLogger.logOutputChannel = window.createOutputChannel(l10n.t("Zowe Explorer for IBM CICS TS"), { log: true });

    CICSLogger.logOutputChannel.info(l10n.t("Initialized logger for Zowe Explorer for IBM CICS TS"));

    const packageJSON = extensions.getExtension("zowe.cics-extension-for-zowe").packageJSON;

    CICSLogger.logOutputChannel.info(`${packageJSON.displayName as string} ${packageJSON.version as string}`);
    CICSLogger.logOutputChannel.info(
      l10n.t({
        message: "Zowe Explorer for IBM CICS TS log level: {0}",
        args: [LogLevel[this.logOutputChannel.logLevel]],
        comment: ["Log level"],
      })
    );
  }

  private static ensureInitialized(): void {
    if (!CICSLogger.amInitialized) {
      CICSLogger.initialize();
      CICSLogger.amInitialized = true;
    }
  }

  public static trace(message: string): void {
    CICSLogger.ensureInitialized();
    CICSLogger.logOutputChannel.trace(message);
  }

  public static debug(message: string): void {
    CICSLogger.ensureInitialized();
    CICSLogger.logOutputChannel.debug(message);
  }

  public static info(message: string): void {
    CICSLogger.ensureInitialized();
    CICSLogger.logOutputChannel.info(message);
  }

  public static warn(message: string): void {
    CICSLogger.ensureInitialized();
    CICSLogger.logOutputChannel.warn(message);
  }

  public static error(message: string): void {
    CICSLogger.ensureInitialized();
    CICSLogger.logOutputChannel.error(message);
  }

  public static fatal(message: string): void {
    CICSLogger.ensureInitialized();
    CICSLogger.logOutputChannel.error(message);
  }

  public static dispose(): void {
    CICSLogger.ensureInitialized();
    CICSLogger.logOutputChannel.dispose();
  }
}
