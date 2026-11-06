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

import { IZoweLogger, MessageSeverity, ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";
import * as path from "path";
import { type ExtensionContext, extensions, l10n, type OutputChannel, window, workspace } from "vscode";

// Not localized: the name identifies the channel
const CHANNEL_NAME = "Zowe Explorer for IBM CICS TS";

const DEFAULT_LEVEL = MessageSeverity.INFO;

// Anything above FATAL, so that nothing passes the filter
const OFF = MessageSeverity.FATAL + 1;

/**
 * Logs to the "Zowe Explorer for IBM CICS TS" output channel and, once init() has been called,
 * to a log file. This follows the approach of Zowe Explorer's own logger: the level comes from
 * a setting ("zowe.cics.logLevel") that is read on every call, so a change takes effect
 * immediately and persists.
 */
export class CICSLogger {
  private static outputChannel: OutputChannel;
  private static fileLogger: IZoweLogger;

  /**
   * Starts logging to a file in the extension's log folder (or the Zowe custom logs folder,
   * if one is set). Until this is called, messages go to the output channel only.
   */
  public static init(context: ExtensionContext): void {
    const customLogsPath = ZoweVsCodeExtension.customLoggingPath;
    // Zowe Explorer writes <logs folder>/logs/zowe.log, so keep ours in a separate sub folder
    const logsPath = customLogsPath ? path.join(customLogsPath, "cics") : context.logUri.fsPath;

    CICSLogger.fileLogger = new IZoweLogger(CHANNEL_NAME, logsPath);
    // The level is applied by CICSLogger.write; the underlying logger must not filter as well
    CICSLogger.fileLogger.getImperativeLogger().level = "TRACE";

    CICSLogger.info(l10n.t("Initialized logger for Zowe Explorer for IBM CICS TS"));

    const packageJSON = extensions.getExtension("zowe.cics-extension-for-zowe").packageJSON;
    CICSLogger.info(`${packageJSON.displayName as string} ${packageJSON.version as string}`);
    CICSLogger.info(
      l10n.t({
        message: "Zowe Explorer for IBM CICS TS log level: {0}",
        args: [MessageSeverity[CICSLogger.getLevel()] ?? "OFF"],
        comment: ["Log level"],
      })
    );
    CICSLogger.info(`Log file: ${path.join(logsPath, "logs", "zowe.log")}`);
  }

  private static getChannel(): OutputChannel {
    CICSLogger.outputChannel ??= window.createOutputChannel(CHANNEL_NAME);
    return CICSLogger.outputChannel;
  }

  /**
   * Reads the "zowe.cics.logLevel" setting.
   */
  private static getLevel(): number {
    const value = workspace.getConfiguration("zowe.cics").get<string>("logLevel")?.toUpperCase();
    if (value === "OFF") {
      return OFF;
    }
    const level = MessageSeverity[value as keyof typeof MessageSeverity];
    // The enum is numeric, so a numeric string such as "0" would map back to a name: ignore those
    return typeof level === "number" ? level : DEFAULT_LEVEL;
  }

  private static write(severity: MessageSeverity, message: string): void {
    if (severity < CICSLogger.getLevel()) {
      return;
    }

    CICSLogger.getChannel().appendLine(`[${new Date().toISOString()}] [${MessageSeverity[severity]}] ${message}`);
    CICSLogger.fileLogger?.logImperativeMessage(message, severity);
  }

  public static trace(message: string): void {
    CICSLogger.write(MessageSeverity.TRACE, message);
  }

  public static debug(message: string): void {
    CICSLogger.write(MessageSeverity.DEBUG, message);
  }

  public static info(message: string): void {
    CICSLogger.write(MessageSeverity.INFO, message);
  }

  public static warn(message: string): void {
    CICSLogger.write(MessageSeverity.WARN, message);
  }

  public static error(message: string): void {
    CICSLogger.write(MessageSeverity.ERROR, message);
  }

  public static fatal(message: string): void {
    CICSLogger.write(MessageSeverity.FATAL, message);
  }

  public static dispose(): void {
    CICSLogger.outputChannel?.dispose();
    CICSLogger.outputChannel = undefined;
  }
}
