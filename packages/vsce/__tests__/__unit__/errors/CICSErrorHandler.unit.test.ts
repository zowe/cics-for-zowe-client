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

import { Gui } from "@zowe/zowe-explorer-api";
import { MessageItem, Uri } from "vscode";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";
import { CICSExtensionError } from "../../../src/errors/CICSExtensionError";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import * as urlUtils from "../../../src/utils/urlUtils";

jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/urlUtils");

describe("CICSErrorHandler", () => {
  let mockGuiErrorMessage: jest.SpyInstance<Thenable<string | MessageItem | undefined>>;
  let mockLoggerError: jest.SpyInstance<void>;
  let mockGenerateDocumentationURL: jest.SpyInstance<Uri | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGuiErrorMessage = jest.spyOn(Gui, "errorMessage").mockResolvedValue(undefined);
    mockLoggerError = jest.spyOn(CICSLogger, "error").mockImplementation();
    mockGenerateDocumentationURL = jest.spyOn(urlUtils, "generateDocumentationURL");
  });

  describe("handleCMCIRestError", () => {
    it("should handle error with message only", async () => {
      const baseError = new Error("Base error");
      const error = new CICSExtensionError({
        errorMessage: "Test error message",
        profileName: "testProfile",
        baseError: baseError,
      });

      await CICSErrorHandler.handleCMCIRestError(error);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      // Logger gets the message with stack trace appended
      expect(mockLoggerError).toHaveBeenCalledWith(`${expectedMessage}\n${baseError.stack}`);
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(expectedMessage, { items: [] });
    });

    it("should handle error with message and stack trace", async () => {
      const baseError = new Error("Base error");
      const error = new CICSExtensionError({
        errorMessage: "Test error message",
        profileName: "testProfile",
        baseError: baseError,
        stackTrace: "Stack trace details",
      });

      await CICSErrorHandler.handleCMCIRestError(error);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockLoggerError).toHaveBeenCalledWith(`${expectedMessage}\n${baseError.stack}`);
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(expectedMessage, { items: [] });
    });

    it("should handle error with custom actions", async () => {
      const error = new CICSExtensionError({
        errorMessage: "Test error message",
        profileName: "testProfile",
        baseError: new Error("Base error"),
      });
      const actions: MessageItem[] = [{ title: "Retry" }, { title: "Cancel" }];

      await CICSErrorHandler.handleCMCIRestError(error, actions);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(expectedMessage, { items: actions });
    });

    it("should add documentation link when resourceType is provided and no actions", async () => {
      const error = new CICSExtensionError({
        errorMessage: "Resource error occurred",
        profileName: "testProfile",
        baseError: new Error("Base error"),
        resourceType: "CICSProgram",
      });

      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://docs.example.com/program"));

      await CICSErrorHandler.handleCMCIRestError(error);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockGenerateDocumentationURL).toHaveBeenCalledWith("cicsprogram");
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining(expectedMessage),
        { items: [] }
      );
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("[IBM documentation](https://docs.example.com/program)"),
        { items: [] }
      );
    });

    it("should not add documentation link when resourceType is provided but actions exist", async () => {
      const error = new CICSExtensionError({
        errorMessage: "Resource error occurred",
        profileName: "testProfile",
        baseError: new Error("Base error"),
        resourceType: "CICSProgram",
      });
      const actions: MessageItem[] = [{ title: "Retry" }];

      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://docs.example.com/program"));

      await CICSErrorHandler.handleCMCIRestError(error, actions);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockGenerateDocumentationURL).not.toHaveBeenCalled();
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(expectedMessage, { items: actions });
    });

    it("should not add documentation link when docUrl is undefined", async () => {
      const error = new CICSExtensionError({
        errorMessage: "Resource error occurred",
        profileName: "testProfile",
        baseError: new Error("Base error"),
        resourceType: "CICSRegion",
      });

      mockGenerateDocumentationURL.mockReturnValue(undefined);

      await CICSErrorHandler.handleCMCIRestError(error);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockGenerateDocumentationURL).toHaveBeenCalledWith("cicsregion");
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(expectedMessage, { items: [] });
    });

    it("should add documentation link when resourceType is provided, no actions, and docUrl is valid", async () => {
      const error = new CICSExtensionError({
        errorMessage: "Resource error occurred",
        profileName: "testProfile",
        baseError: new Error("Base error"),
        resourceType: "CICSTransaction",
      });

      const mockDocUrl = Uri.parse("https://docs.example.com/transaction");
      mockGenerateDocumentationURL.mockReturnValue(mockDocUrl);

      await CICSErrorHandler.handleCMCIRestError(error);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockGenerateDocumentationURL).toHaveBeenCalledWith("cicstransaction");
      
      // Verify the documentation link is added to the message
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining(expectedMessage),
        { items: [] }
      );
      expect(mockGuiErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("[IBM documentation](https://docs.example.com/transaction)"),
        { items: [] }
      );
    });

    it("should trim resourceType before generating documentation URL", async () => {
      const error = new CICSExtensionError({
        errorMessage: "Resource error occurred",
        profileName: "testProfile",
        baseError: new Error("Base error"),
        resourceType: "  CICSProgram  ",
      });

      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://docs.example.com/program"));

      await CICSErrorHandler.handleCMCIRestError(error);

      expect(mockGenerateDocumentationURL).toHaveBeenCalledWith("cicsprogram");
    });

    it("should trim line breaks in error messages", async () => {
      const baseError = new Error("Base error");
      const error = new CICSExtensionError({
        errorMessage: "Error\nwith\nmultiple\nlines",
        profileName: "testProfile",
        baseError: baseError,
      });

      await CICSErrorHandler.handleCMCIRestError(error);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockLoggerError).toHaveBeenCalledWith(`${expectedMessage}\n${baseError.stack}`);
    });

    it("should trim multiple spaces in error messages", async () => {
      const baseError = new Error("Base error");
      const error = new CICSExtensionError({
        errorMessage: "Error   with    multiple     spaces",
        profileName: "testProfile",
        baseError: baseError,
      });

      await CICSErrorHandler.handleCMCIRestError(error);

      const expectedMessage = "The request on profile testProfile failed. Error message: Base error, Cause: undefined";
      expect(mockLoggerError).toHaveBeenCalledWith(`${expectedMessage}\n${baseError.stack}`);
    });
  });

  describe("handleExtensionError", () => {
    it("should exist as a method", () => {
      const handler = new CICSErrorHandler();
      expect(handler.handleExtensionError).toBeDefined();
      expect(typeof handler.handleExtensionError).toBe("function");
    });

    it("should be callable without errors", () => {
      const handler = new CICSErrorHandler();
      expect(() => handler.handleExtensionError()).not.toThrow();
    });
  });

  describe("formatMessageWithDocLink", () => {
    it("should format message with documentation link when docUrl is available", () => {
      const message = "Warning: Incomplete results detected";
      const resourceType = "get";
      
      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://docs.example.com/get"));

      const result = CICSErrorHandler.formatMessageWithDocLink(message, resourceType);

      expect(mockGenerateDocumentationURL).toHaveBeenCalledWith("get");
      expect(result).toContain(message);
      expect(result).toContain("[IBM documentation](https://docs.example.com/get)");
    });

    it("should return original message when docUrl is undefined", () => {
      const message = "Warning: Incomplete results detected";
      const resourceType = "unknown";
      
      mockGenerateDocumentationURL.mockReturnValue(undefined);

      const result = CICSErrorHandler.formatMessageWithDocLink(message, resourceType);

      expect(mockGenerateDocumentationURL).toHaveBeenCalledWith("unknown");
      expect(result).toBe(message);
    });
  });

  describe("handleErrorIfPresent - handleApiResponseError path", () => {
    it("should return false when resultsummary is missing", () => {
      const apiResponse = {
        response: {
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      } as any;

      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse);

      expect(result).toBe(false);
    });

    it("should call showErrorWithDocLink when error with records is detected (not NOTPERMIT)", () => {
      const mockShowErrorMessage = jest.spyOn(require("vscode").window, "showErrorMessage");
      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://docs.example.com/get"));

      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1028",
            api_function: "GET",
            api_response1_alt: "INVALIDPARM",
            api_response2: "0",
            api_response2_alt: "OK",
            recordcount: "1",
            displayed_recordcount: "1"
          },
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      };

      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse, "get", "MYPROF");

      expect(result).toBe(true);
      expect(mockShowErrorMessage).toHaveBeenCalled();
    });

    it("should not show error notification when NOTPERMIT error with records is detected", () => {
      const mockShowErrorMessage = jest.spyOn(require("vscode").window, "showErrorMessage");
      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://docs.example.com/get"));

      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1031",
            api_function: "GET",
            api_response1_alt: "NOTPERMIT",
            api_response2: "0",
            api_response2_alt: "USRID",
            recordcount: "1",
            displayed_recordcount: "1"
          },
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      };

      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse, "get", "MYPROF");

      expect(result).toBe(true);
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it("should trim and lowercase resourceType before generating documentation URL", () => {
      const message = "Warning message";
      const resourceType = "  GET  ";
      
      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://docs.example.com/get"));

      CICSErrorHandler.formatMessageWithDocLink(message, resourceType);

      expect(mockGenerateDocumentationURL).toHaveBeenCalledWith("get");
    });
  });

  describe("handleErrorIfPresent", () => {
    it("should return false when apiResponse is null", () => {
      const result = CICSErrorHandler.handleErrorIfPresent(null);
      expect(result).toBe(false);
    });

    it("should return false when apiResponse is undefined", () => {
      const result = CICSErrorHandler.handleErrorIfPresent(undefined);
      expect(result).toBe(false);
    });

    it("should return false when response is OK", () => {
      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1024",
            api_function: "GET",
            api_response1_alt: "OK",
            api_response2: "0",
            api_response2_alt: "",
            recordcount: "5",
            displayed_recordcount: "5"
          },
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      };
      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse);
      expect(result).toBe(false);
    });

    it("should return false when response is not OK but has no records", () => {
      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1031",
            api_function: "GET",
            api_response1_alt: "NOTPERMIT",
            api_response2: "0",
            api_response2_alt: "USRID",
            recordcount: "0",
            displayed_recordcount: "0"
          },
          records: {}
        }
      };
      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse);
      expect(result).toBe(false);
    });

    it("should return true and NOT show error notification when NOTPERMIT response with records", () => {
      const mockShowErrorMessage = jest.fn();
      jest.spyOn(require("vscode").window, "showErrorMessage").mockImplementation(mockShowErrorMessage);

      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1031",
            api_function: "GET",
            api_response1_alt: "NOTPERMIT",
            api_response2: "0",
            api_response2_alt: "USRID",
            recordcount: "5",
            displayed_recordcount: "5"
          },
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      };

      mockGenerateDocumentationURL.mockReturnValue(undefined);

      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse, "get");
      
      expect(result).toBe(true);
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it("should return true and show error notification when non-NOTPERMIT error with records", () => {
      const mockShowErrorMessage = jest.fn();
      jest.spyOn(require("vscode").window, "showErrorMessage").mockImplementation(mockShowErrorMessage);

      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1028",
            api_function: "GET",
            api_response1_alt: "INVALIDPARM",
            api_response2: "0",
            api_response2_alt: "OK",
            recordcount: "5",
            displayed_recordcount: "5"
          },
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      };

      mockGenerateDocumentationURL.mockReturnValue(undefined);

      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse, "get");
      
      expect(result).toBe(true);
      expect(mockShowErrorMessage).toHaveBeenCalled();
      const errorMessage = mockShowErrorMessage.mock.calls[0][0];
      expect(errorMessage).toContain("The request failed");
      expect(errorMessage).toContain("1028");
      expect(errorMessage).toContain("INVALIDPARM");
    });

    it("should include profile name in error message when provided (non-NOTPERMIT)", () => {
      const mockShowErrorMessage = jest.fn();
      jest.spyOn(require("vscode").window, "showErrorMessage").mockImplementation(mockShowErrorMessage);

      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1028",
            api_function: "GET",
            api_response1_alt: "INVALIDPARM",
            api_response2: "0",
            api_response2_alt: "OK",
            recordcount: "5",
            displayed_recordcount: "5"
          },
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      };

      mockGenerateDocumentationURL.mockReturnValue(undefined);

      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse, "get", "MYPROF");
      
      expect(result).toBe(true);
      expect(mockShowErrorMessage).toHaveBeenCalled();
      const errorMessage = mockShowErrorMessage.mock.calls[0][0];
      expect(errorMessage).toContain("MYPROF");
    });

    it("should add documentation link when resourceType is provided (non-NOTPERMIT)", () => {
      const mockShowErrorMessage = jest.fn();
      jest.spyOn(require("vscode").window, "showErrorMessage").mockImplementation(mockShowErrorMessage);

      const apiResponse = {
        response: {
          resultsummary: {
            api_response1: "1028",
            api_function: "GET",
            api_response1_alt: "INVALIDPARM",
            api_response2: "0",
            api_response2_alt: "OK",
            recordcount: "5",
            displayed_recordcount: "5"
          },
          records: { cicsprogram: [{ program: "PROG1" }] }
        }
      };

      mockGenerateDocumentationURL.mockReturnValue(require("vscode").Uri.parse("https://docs.example.com/get"));

      const result = CICSErrorHandler.handleErrorIfPresent(apiResponse, "get");
      
      expect(result).toBe(true);
      expect(mockShowErrorMessage).toHaveBeenCalled();
      const errorMessage = mockShowErrorMessage.mock.calls[0][0];
      expect(errorMessage).toContain("[IBM documentation]");
    });

    it("should handle result summary directly with NOTPERMIT error and records - no notification", () => {
      const mockShowErrorMessage = jest.fn();
      jest.spyOn(require("vscode").window, "showErrorMessage").mockImplementation(mockShowErrorMessage);

      const resultSummary = {
        api_response1: "1031",
        api_function: "GET",
        api_response1_alt: "NOTPERMIT",
        api_response2: "0",
        api_response2_alt: "USRID",
        recordcount: "5",
        displayed_recordcount: "5"
      };

      mockGenerateDocumentationURL.mockReturnValue(undefined);

      const result = CICSErrorHandler.handleErrorIfPresent(resultSummary, "get");
      
      expect(result).toBe(true);
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it("should return false when result summary has error but no records", () => {
      const resultSummary = {
        api_response1: "1031",
        api_function: "GET",
        api_response1_alt: "NOTPERMIT",
        api_response2: "0",
        api_response2_alt: "USRID",
        recordcount: "0",
        displayed_recordcount: "0"
      };

      const result = CICSErrorHandler.handleErrorIfPresent(resultSummary, "get");
      
      expect(result).toBe(false);
    });

    it("should return false when result summary is OK", () => {
      const resultSummary = {
        api_response1: "1024",
        api_function: "GET",
        api_response1_alt: "OK",
        api_response2: "0",
        api_response2_alt: "",
        recordcount: "5",
        displayed_recordcount: "5"
      };

      const result = CICSErrorHandler.handleErrorIfPresent(resultSummary, "get");
      
      expect(result).toBe(false);
    });

    it("should handle result summary with NOTPERMIT and profile name - no notification", () => {
      const mockShowErrorMessage = jest.fn();
      jest.spyOn(require("vscode").window, "showErrorMessage").mockImplementation(mockShowErrorMessage);

      const resultSummary = {
        api_response1: "1031",
        api_function: "GET",
        api_response1_alt: "NOTPERMIT",
        api_response2: "0",
        api_response2_alt: "USRID",
        recordcount: "5",
        displayed_recordcount: "5"
      };

      mockGenerateDocumentationURL.mockReturnValue(undefined);

      const result = CICSErrorHandler.handleErrorIfPresent(resultSummary, "get", "MYPROF");
      
      expect(result).toBe(true);
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });
  });

  describe("buildIncompleteResultsTooltip", () => {
    // Use the vscode mock's MarkdownString (same module path jest resolves to)
    const MS = require("vscode").MarkdownString as typeof import("vscode").MarkdownString;

    it("should build tooltip with NOTPERMIT resp codes and IBM docs link", () => {
      mockGenerateDocumentationURL.mockReturnValue(Uri.parse("https://www.ibm.com/docs/en/test"));

      const summary = {
        api_response1: "1031",
        api_response2: "1345",
        api_response1_alt: "NOTPERMIT",
        api_response2_alt: "USRID",
        recordcount: "5",
      } as any;

      const tooltip = CICSErrorHandler.buildIncompleteResultsTooltip(summary);

      expect(tooltip).toBeInstanceOf(MS);
      const value = tooltip!.value;
      expect(value).toContain("Retrieving these resources resulted in an error:");
      expect(value).toContain("NOTPERMIT (1031) / USRID (1345)");
      expect(value).toContain("IBM docs");
    });

    it("should return undefined when summary has OK response code", () => {
      const summary = {
        api_response1: "1024",
        api_response2: "0",
        api_response1_alt: "OK",
        api_response2_alt: "",
      } as any;

      const tooltip = CICSErrorHandler.buildIncompleteResultsTooltip(summary);
      expect(tooltip).toBeUndefined();
    });

    it("should return undefined for non-NOTPERMIT error codes (tooltip only shown for NOTPERMIT)", () => {
      const summary = {
        api_response1: "1028",
        api_response2: "0",
        api_response1_alt: "INVALIDPARM",
        api_response2_alt: "OK",
        recordcount: "5",
      } as any;

      const tooltip = CICSErrorHandler.buildIncompleteResultsTooltip(summary);
      expect(tooltip).toBeUndefined();
    });

    it("should return undefined for null summary", () => {
      expect(CICSErrorHandler.buildIncompleteResultsTooltip(null as any)).toBeUndefined();
    });

    it("should fall back to numeric codes when alt text is missing", () => {
      mockGenerateDocumentationURL.mockReturnValue(undefined);

      const summary = {
        api_response1: "1031",
        api_response2: "1345",
        recordcount: "5",
      } as any;

      const tooltip = CICSErrorHandler.buildIncompleteResultsTooltip(summary);
      expect(tooltip).toBeInstanceOf(MS);
      expect(tooltip!.value).toContain("1031");
      expect(tooltip!.value).toContain("1345");
    });
  });


});


