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

import { extensions } from "vscode";
import { CICSLogger } from "../../../src/utils/CICSLogger";

const infoSpy = jest.spyOn(CICSLogger, "info");
const traceSpy = jest.spyOn(CICSLogger, "trace");
const debugSpy = jest.spyOn(CICSLogger, "debug");
const warnSpy = jest.spyOn(CICSLogger, "warn");
const errorSpy = jest.spyOn(CICSLogger, "error");
const fatalSpy = jest.spyOn(CICSLogger, "fatal");
const disposeSpy = jest.spyOn(CICSLogger, "dispose");

const extensionSpy = jest.spyOn(extensions, "getExtension");

describe("CICS Logger", () => {
  it("should initialise logger", () => {
    expect(extensionSpy).toHaveBeenCalledTimes(0);
    CICSLogger.debug("First call of logger");
    expect(extensionSpy).toHaveBeenCalledTimes(1);
    expect(extensionSpy).toHaveBeenCalledWith("zowe.cics-extension-for-zowe");

    debugSpy.mockReset();
  });

  it("should log info", () => {
    expect(infoSpy).toHaveBeenCalledTimes(0);
    CICSLogger.info("MY MSG");
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("should log trace", () => {
    expect(traceSpy).toHaveBeenCalledTimes(0);
    CICSLogger.trace("MY MSG");
    expect(traceSpy).toHaveBeenCalledTimes(1);
  });

  it("should log debug", () => {
    expect(debugSpy).toHaveBeenCalledTimes(0);
    CICSLogger.debug("MY MSG");
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });

  it("should log warn", () => {
    expect(warnSpy).toHaveBeenCalledTimes(0);
    CICSLogger.warn("MY MSG");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("should log error", () => {
    expect(errorSpy).toHaveBeenCalledTimes(0);
    CICSLogger.error("MY MSG");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("should log fatal", () => {
    expect(fatalSpy).toHaveBeenCalledTimes(0);
    CICSLogger.fatal("MY MSG");
    expect(fatalSpy).toHaveBeenCalledTimes(1);
  });

  it("should dispose Logger", () => {
    expect(disposeSpy).toHaveBeenCalledTimes(0);
    CICSLogger.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
