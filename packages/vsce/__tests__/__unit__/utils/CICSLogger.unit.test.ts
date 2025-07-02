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

const infoMock = jest.fn();
const traceMock = jest.fn();
const debugMock = jest.fn();
const warnMock = jest.fn();
const errorMock = jest.fn();
const fatalMock = jest.fn();
const disposeMock = jest.fn();

const outputChannelMock = jest.fn().mockReturnValue({
  logLevel: "info",
  dispose: disposeMock,
  info: infoMock,
  trace: traceMock,
  debug: debugMock,
  warn: warnMock,
  error: errorMock,
  fatal: fatalMock,
});
const getExtensionMock = jest.fn().mockReturnValue({
  packageJSON: {
    displayName: "CICS EXT",
    version: "1.2.3",
  },
});

jest.mock("vscode", () => {
  return {
    window: {
      createOutputChannel: outputChannelMock,
    },
    l10n: {
      t: jest.fn(),
    },
    extensions: {
      getExtension: getExtensionMock,
    },
    LogLevel: {
      info: 3
    }
  };
});

import { CICSLogger } from "../../../src/utils/CICSLogger";

// const infoSpy = jest.spyOn(CICSLogger, "info");

describe("CICS Logger", () => {

  it("should initialise logger", () => {
    expect(infoMock).toHaveBeenCalledTimes(0);
    CICSLogger.initialize();
    expect(infoMock).toHaveBeenCalledTimes(3);
  });

  it("should log trace", () => {
    expect(traceMock).toHaveBeenCalledTimes(0);
    CICSLogger.trace("MY MSG");
    expect(traceMock).toHaveBeenCalledTimes(1);
  });

  it("should log debug", () => {
    expect(debugMock).toHaveBeenCalledTimes(0);
    CICSLogger.debug("MY MSG");
    expect(debugMock).toHaveBeenCalledTimes(1);
  });

  it("should log warn", () => {
    expect(warnMock).toHaveBeenCalledTimes(0);
    CICSLogger.warn("MY MSG");
    expect(warnMock).toHaveBeenCalledTimes(1);
  });

  it("should log error", () => {
    expect(errorMock).toHaveBeenCalledTimes(0);
    CICSLogger.error("MY MSG");
    expect(errorMock).toHaveBeenCalledTimes(1);
  });

  it("should log fatal", () => {
    errorMock.mockReset();
    expect(errorMock).toHaveBeenCalledTimes(0);
    CICSLogger.fatal("MY MSG");
    expect(errorMock).toHaveBeenCalledTimes(1);
  });

  it("should dispose Logger", () => {
    expect(disposeMock).toHaveBeenCalledTimes(0);
    CICSLogger.dispose();
    expect(disposeMock).toHaveBeenCalledTimes(1);
  });
});
