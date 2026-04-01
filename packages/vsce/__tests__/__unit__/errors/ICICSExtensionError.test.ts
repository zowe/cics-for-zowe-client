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

import type { ICICSExtensionError } from "../../../src/errors/ICICSExtensionError";

describe("ICICSExtensionError Interface", () => {
  it("should define the interface structure with all properties", () => {
    const mockError: ICICSExtensionError = {
      errorMessage: "Test error message",
      statusCode: 500,
      baseError: new Error("Base error"),
      resp1Code: 1,
      resp2Code: 2,
      resourceName: "TESTPROG",
      resourceType: "PROGRAM",
      profileName: "testProfile",
      stackTrace: "Error stack trace",
    };

    expect(mockError.errorMessage).toBe("Test error message");
    expect(mockError.statusCode).toBe(500);
    expect(mockError.baseError).toBeInstanceOf(Error);
    expect(mockError.resp1Code).toBe(1);
    expect(mockError.resp2Code).toBe(2);
    expect(mockError.resourceName).toBe("TESTPROG");
    expect(mockError.resourceType).toBe("PROGRAM");
    expect(mockError.profileName).toBe("testProfile");
    expect(mockError.stackTrace).toBe("Error stack trace");
  });

  it("should allow optional properties to be undefined", () => {
    const mockError: ICICSExtensionError = {
      baseError: new Error("Base error"),
      profileName: "testProfile",
    };

    expect(mockError.errorMessage).toBeUndefined();
    expect(mockError.statusCode).toBeUndefined();
    expect(mockError.resp1Code).toBeUndefined();
    expect(mockError.resp2Code).toBeUndefined();
    expect(mockError.resourceName).toBeUndefined();
    expect(mockError.resourceType).toBeUndefined();
    expect(mockError.stackTrace).toBeUndefined();
    expect(mockError.baseError).toBeInstanceOf(Error);
    expect(mockError.profileName).toBe("testProfile");
  });

  it("should allow baseError to be any type", () => {
    const mockError1: ICICSExtensionError = {
      baseError: "string error",
      profileName: "testProfile",
    };

    const mockError2: ICICSExtensionError = {
      baseError: { custom: "error object" },
      profileName: "testProfile",
    };

    const mockError3: ICICSExtensionError = {
      baseError: 123,
      profileName: "testProfile",
    };

    expect(mockError1.baseError).toBe("string error");
    expect(mockError2.baseError).toEqual({ custom: "error object" });
    expect(mockError3.baseError).toBe(123);
  });
});