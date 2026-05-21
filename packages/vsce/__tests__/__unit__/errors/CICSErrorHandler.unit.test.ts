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
});


