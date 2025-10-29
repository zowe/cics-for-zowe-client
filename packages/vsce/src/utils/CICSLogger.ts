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

export class CICSLogger {
  private static logOutputChannel: LogOutputChannel;

  public static initialize() {
    CICSLogger.logOutputChannel = window.createOutputChannel(l10n.t("Zowe Explorer for IBM CICS TS"), { log: true });

    CICSLogger.info(l10n.t("Initialized logger for Zowe Explorer for IBM CICS TS"));

    const extCandidate = extensions.getExtension("zowe.cics-extension-for-zowe") ?? extensions.all.find((e) => /cics|zowe/i.test(e.id));
    const packageJSON = extCandidate?.packageJSON ?? { displayName: "Zowe Explorer for IBM CICS TS", version: "0.0.0" };

    CICSLogger.info(`${packageJSON.displayName as string} ${packageJSON.version as string}`);
    CICSLogger.info(l10n.t("Zowe Explorer for IBM CICS TS log level: {0}", LogLevel[this.logOutputChannel.logLevel]));
  }

  public static trace(message: string): void {
    CICSLogger.logOutputChannel.trace(message);
  }

  public static debug(message: string): void {
    CICSLogger.logOutputChannel.debug(message);
  }

  public static info(message: string): void {
    CICSLogger.logOutputChannel.info(message);
  }

  public static warn(message: string): void {
    CICSLogger.logOutputChannel.warn(message);
  }

  public static error(message: string): void {
    CICSLogger.logOutputChannel.error(message);
  }

  public static fatal(message: string): void {
    CICSLogger.logOutputChannel.error(message);
  }

  public static dispose(): void {
    CICSLogger.logOutputChannel.dispose();
  }
}
