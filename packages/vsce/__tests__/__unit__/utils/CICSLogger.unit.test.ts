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
import { type ExtensionContext, window, workspace } from "vscode";
import { CICSLogger } from "../../../src/utils/CICSLogger";

describe("CICS Logger", () => {
  const channel = (window.createOutputChannel as jest.Mock)();
  const getConfigurationMock = workspace.getConfiguration as jest.Mock;
  const originalConfiguration = getConfigurationMock.getMockImplementation();
  const context = { logUri: { fsPath: "/logs/cics" } } as unknown as ExtensionContext;

  const imperativeLogger = { level: "" };
  const logImperativeMessage = jest.fn();

  const setLevel = (value: string | undefined) => getConfigurationMock.mockImplementation(() => ({ get: () => value }));

  beforeEach(() => {
    jest.clearAllMocks();
    setLevel("info");
    (IZoweLogger as unknown as jest.Mock).mockImplementation(() => ({
      getImperativeLogger: () => imperativeLogger,
      logImperativeMessage,
    }));
  });

  afterAll(() => {
    getConfigurationMock.mockImplementation(originalConfiguration);
  });

  it("should write to the output channel before init is called", () => {
    CICSLogger.info("MY MSG");

    expect(channel.appendLine).toHaveBeenCalledWith(expect.stringMatching(/^\[.+\] \[INFO\] MY MSG$/));
    expect(logImperativeMessage).not.toHaveBeenCalled();
  });

  describe("init", () => {
    afterEach(() => {
      (ZoweVsCodeExtension as any).customLoggingPath = undefined;
    });

    it("should log to the extension log folder", () => {
      CICSLogger.init(context);

      expect(IZoweLogger).toHaveBeenCalledWith("Zowe Explorer for IBM CICS TS", "/logs/cics");
      expect(imperativeLogger.level).toBe("TRACE");
      expect(channel.appendLine).toHaveBeenCalledWith(expect.stringContaining("Initialized logger for Zowe Explorer for IBM CICS TS"));
      expect(channel.appendLine).toHaveBeenCalledWith(expect.stringContaining("Zowe Explorer for IBM CICS TS 3.15.0"));
      expect(channel.appendLine).toHaveBeenCalledWith(expect.stringContaining("log level: INFO"));
      expect(channel.appendLine).toHaveBeenCalledWith(expect.stringContaining(path.join("/logs/cics", "logs", "zowe.log")));
    });

    it("should use the Zowe custom logs folder when one is set", () => {
      (ZoweVsCodeExtension as any).customLoggingPath = "/custom";

      CICSLogger.init(context);

      expect(IZoweLogger).toHaveBeenCalledWith("Zowe Explorer for IBM CICS TS", path.join("/custom", "cics"));
    });

    it("should log nothing during init when the level is off", () => {
      setLevel("off");

      CICSLogger.init(context);

      expect(channel.appendLine).not.toHaveBeenCalled();
    });
  });

  describe("writing", () => {
    beforeEach(() => {
      CICSLogger.init(context);
      jest.clearAllMocks();
    });

    it.each([
      ["trace", MessageSeverity.TRACE, "TRACE"],
      ["debug", MessageSeverity.DEBUG, "DEBUG"],
      ["info", MessageSeverity.INFO, "INFO"],
      ["warn", MessageSeverity.WARN, "WARN"],
      ["error", MessageSeverity.ERROR, "ERROR"],
      ["fatal", MessageSeverity.FATAL, "FATAL"],
    ] as const)("should log %s to the channel and the file", (method, severity, name) => {
      setLevel("trace");

      CICSLogger[method]("MY MSG");

      expect(channel.appendLine).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^\\[.+\\] \\[${name}\\] MY MSG$`)));
      expect(logImperativeMessage).toHaveBeenCalledWith("MY MSG", severity);
    });

    it("should drop messages below the configured level", () => {
      setLevel("error");

      CICSLogger.warn("MY MSG");
      CICSLogger.info("MY MSG");
      expect(channel.appendLine).not.toHaveBeenCalled();
      expect(logImperativeMessage).not.toHaveBeenCalled();

      CICSLogger.error("MY MSG");
      CICSLogger.fatal("MY MSG");
      expect(channel.appendLine).toHaveBeenCalledTimes(2);
    });

    it("should log nothing when the level is off", () => {
      setLevel("off");

      CICSLogger.fatal("MY MSG");

      expect(channel.appendLine).not.toHaveBeenCalled();
      expect(logImperativeMessage).not.toHaveBeenCalled();
    });

    it("should pick up a changed level without restarting", () => {
      setLevel("info");
      CICSLogger.debug("MY MSG");
      expect(channel.appendLine).not.toHaveBeenCalled();

      setLevel("debug");
      CICSLogger.debug("MY MSG");
      expect(channel.appendLine).toHaveBeenCalledTimes(1);
    });

    it("should fall back to info when the setting is missing or invalid", () => {
      setLevel(undefined);
      CICSLogger.debug("MY MSG");
      CICSLogger.info("MY MSG");
      expect(channel.appendLine).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();
      setLevel("nonsense");
      CICSLogger.debug("MY MSG");
      CICSLogger.info("MY MSG");
      expect(channel.appendLine).toHaveBeenCalledTimes(1);
    });

    it("should fall back to info when the setting is a numeric string", () => {
      setLevel("0");
      CICSLogger.debug("MY MSG");
      CICSLogger.info("MY MSG");
      expect(channel.appendLine).toHaveBeenCalledTimes(1);
    });
  });

  it("should dispose the channel and recreate it on the next log", () => {
    CICSLogger.info("MY MSG");
    CICSLogger.dispose();
    expect(channel.dispose).toHaveBeenCalledTimes(1);

    (window.createOutputChannel as jest.Mock).mockClear();
    CICSLogger.info("MY MSG");
    expect(window.createOutputChannel).toHaveBeenCalledWith("Zowe Explorer for IBM CICS TS");
  });

  it("should not fail to dispose when nothing was logged", () => {
    CICSLogger.dispose();
    expect(() => CICSLogger.dispose()).not.toThrow();
  });
});
