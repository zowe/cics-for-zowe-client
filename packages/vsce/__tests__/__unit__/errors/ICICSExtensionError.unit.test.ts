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

interface ITestErrorWithMetadata extends Error {
  code?: string;
  details?: { info: string };
}

describe("ICICSExtensionError Interface Tests", () => {
  describe("Interface Structure", () => {
    const createError = (overrides: Partial<ICICSExtensionError> = {}): ICICSExtensionError => ({
      baseError: new Error("Test error"),
      profileName: "testProfile",
      ...overrides,
    });

    it("should accept an error with all required properties", () => {
      const error = createError();

      expect(error).toHaveProperty("baseError");
      expect(error).toHaveProperty("profileName");
      expect(error.profileName).toBe("testProfile");
    });

    test.each([
      {
        description: "Error object",
        baseError: new Error("Base error message"),
        assertion: (error: ICICSExtensionError) => {
          expect(error.baseError).toBeInstanceOf(Error);
          expect((error.baseError as Error).message).toBe("Base error message");
        },
      },
      {
        description: "Record object",
        baseError: { code: "ERR001", details: "Error details" },
        assertion: (error: ICICSExtensionError) => {
          expect(error.baseError).toEqual({ code: "ERR001", details: "Error details" });
        },
      },
    ])("should accept an error with $description as baseError", ({ baseError, assertion }) => {
      const error = createError({ baseError });

      assertion(error);
    });

    it("should accept an error with all optional properties", () => {
      const error = createError({
        errorMessage: "Custom error message",
        statusCode: 404,
        baseError: new Error("Base error"),
        resp1Code: 1028,
        resp2Code: 100,
        resourceName: "TESTPROG",
        resourceType: "CICSProgram",
        stackTrace: "Error stack trace",
      });

      expect(error.errorMessage).toBe("Custom error message");
      expect(error.statusCode).toBe(404);
      expect(error.resp1Code).toBe(1028);
      expect(error.resp2Code).toBe(100);
      expect(error.resourceName).toBe("TESTPROG");
      expect(error.resourceType).toBe("CICSProgram");
      expect(error.stackTrace).toBe("Error stack trace");
    });
  });

  describe("Status Code Property", () => {
    it("should accept various HTTP status codes", () => {
      const statusCodes = [200, 400, 401, 403, 404, 500, 502, 503];

      statusCodes.forEach((code) => {
        const error: ICICSExtensionError = {
          statusCode: code,
          baseError: new Error(),
          profileName: "testProfile",
        };
        expect(error.statusCode).toBe(code);
      });
    });
  });

  describe("Response Code Properties", () => {
    it("should accept various CMCI response codes for resp1Code", () => {
      const resp1Codes = [1024, 1027, 1028, 1034, 1041];

      resp1Codes.forEach((code) => {
        const error: ICICSExtensionError = {
          resp1Code: code,
          baseError: new Error(),
          profileName: "testProfile",
        };
        expect(error.resp1Code).toBe(code);
      });
    });

    it("should accept both resp1Code and resp2Code together", () => {
      const error: ICICSExtensionError = {
        resp1Code: 1028,
        resp2Code: 100,
        baseError: new Error(),
        profileName: "testProfile",
      };
      expect(error.resp1Code).toBe(1028);
      expect(error.resp2Code).toBe(100);
    });
  });

  describe("Resource Properties", () => {
    it("should accept various resource names", () => {
      const resourceNames = ["TESTPROG", "TRAN001", "FILE123", "BUNDLE1"];

      resourceNames.forEach((name) => {
        const error: ICICSExtensionError = {
          resourceName: name,
          baseError: new Error(),
          profileName: "testProfile",
        };
        expect(error.resourceName).toBe(name);
      });
    });

    it("should accept both resourceName and resourceType together", () => {
      const error: ICICSExtensionError = {
        resourceName: "TESTPROG",
        resourceType: "CICSProgram",
        baseError: new Error(),
        profileName: "testProfile",
      };
      expect(error.resourceName).toBe("TESTPROG");
      expect(error.resourceType).toBe("CICSProgram");
    });
  });

  describe("Complete Error Scenarios", () => {
    it("should represent a complete CMCI API error", () => {
      const error: ICICSExtensionError = {
        errorMessage: "Resource not found in CICS region",
        statusCode: 404,
        baseError: new Error("CMCI API returned 404"),
        resp1Code: 1027,
        resp2Code: 1,
        resourceName: "TESTPROG",
        resourceType: "CICSProgram",
        profileName: "cics-prod",
        stackTrace: "Error: CMCI API returned 404\n    at handleError (/path/to/handler.js:25:10)",
      };

      expect(error.errorMessage).toBe("Resource not found in CICS region");
      expect(error.statusCode).toBe(404);
      expect(error.resp1Code).toBe(1027);
      expect(error.resp2Code).toBe(1);
      expect(error.resourceName).toBe("TESTPROG");
      expect(error.resourceType).toBe("CICSProgram");
      expect(error.profileName).toBe("cics-prod");
      expect(error.stackTrace).toContain("handleError");
    });

    it("should represent a minimal error with only required fields", () => {
      const error: ICICSExtensionError = {
        baseError: new Error("Minimal error"),
        profileName: "minimal-profile",
      };

      expect(error.baseError).toBeInstanceOf(Error);
      expect(error.profileName).toBe("minimal-profile");
      expect(Object.keys(error).length).toBe(2);
    });

    it("should represent an authentication error", () => {
      const error: ICICSExtensionError = {
        errorMessage: "Authentication failed",
        statusCode: 401,
        baseError: { code: "AUTH_FAILED", reason: "Invalid credentials" },
        profileName: "auth-profile",
      };

      expect(error.errorMessage).toBe("Authentication failed");
      expect(error.statusCode).toBe(401);
      expect((error.baseError as Record<string, unknown>).code).toBe("AUTH_FAILED");
    });
  });

  describe("Type Guard Function", () => {
    function isICICSExtensionError(obj: Partial<ICICSExtensionError> | null | undefined): obj is ICICSExtensionError {
      return (
        obj !== null &&
        obj !== undefined &&
        typeof obj === "object" &&
        "baseError" in obj &&
        "profileName" in obj &&
        typeof obj.profileName === "string"
      );
    }

    it("should validate valid ICICSExtensionError objects", () => {
      const validError: ICICSExtensionError = {
        baseError: new Error(),
        profileName: "test",
      };

      expect(isICICSExtensionError(validError)).toBe(true);
    });

    it("should reject invalid objects", () => {
      expect(isICICSExtensionError(null)).toBe(false);
      expect(isICICSExtensionError(undefined)).toBe(false);
      expect(isICICSExtensionError({})).toBe(false);
      expect(isICICSExtensionError({ baseError: new Error() })).toBe(false);
      expect(isICICSExtensionError({ profileName: "test" })).toBe(false);
    });

    it("should validate objects with optional properties", () => {
      const errorWithOptionals: ICICSExtensionError = {
        errorMessage: "Test",
        statusCode: 500,
        baseError: new Error(),
        profileName: "test",
      };

      expect(isICICSExtensionError(errorWithOptionals)).toBe(true);
    });
  });
});


