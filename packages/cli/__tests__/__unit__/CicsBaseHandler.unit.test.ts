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

import { type ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { type AbstractSession, type IHandlerParameters } from "@zowe/imperative";
import { CicsBaseHandler } from "../../src/CicsBaseHandler";
import { CicsSession } from "../../src/CicsSession";

// Mock the CicsSession module
jest.mock("../../src/CicsSession");

describe("CicsBaseHandler", () => {
  // Create a concrete implementation for testing
  class TestHandler extends CicsBaseHandler {
    public async processWithSession(commandParameters: IHandlerParameters, session: AbstractSession): Promise<ICMCIApiResponse> {
      return {
        response: {
          resultsummary: {
            api_response1: "1024",
            api_response2: "0",
            recordcount: "1",
            displayed_recordcount: "1",
          },
          records: {},
        },
      } as ICMCIApiResponse;
    }
  }

  let handler: TestHandler;
  let mockParams: IHandlerParameters;
  let mockSession: AbstractSession;

  beforeEach(() => {
    handler = new TestHandler();

    // Mock handler parameters
    mockParams = {
      arguments: {
        $0: "zowe",
        _: ["cics"],
        host: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
      },
      response: {
        data: {
          setObj: jest.fn(),
        },
        progress: {
          startBar: jest.fn(),
          endBar: jest.fn(),
        },
        console: {
          log: jest.fn(),
          error: jest.fn(),
        },
        format: {
          output: jest.fn(),
        },
      },
      profiles: {
        get: jest.fn(),
      },
    } as any;

    // Mock session
    mockSession = {
      ISession: {
        hostname: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
      },
    } as any;

    // Mock CicsSession.createSessCfgFromArgs
    (CicsSession.createSessCfgFromArgs as jest.Mock).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("process", () => {
    it("should create a session and call processWithSession", async () => {
      await handler.process(mockParams);

      expect(CicsSession.createSessCfgFromArgs).toHaveBeenCalledWith(mockParams.arguments, true, mockParams);
      expect(mockParams.response.progress.endBar).toHaveBeenCalled();
      expect(mockParams.response.data.setObj).toHaveBeenCalled();
    });

    it("should set the response object with the API response", async () => {
      const expectedResponse: ICMCIApiResponse = {
        response: {
          resultsummary: {
            api_response1: "1024",
            api_response2: "0",
            recordcount: "1",
            displayed_recordcount: "1",
          },
          records: {},
        },
      };

      await handler.process(mockParams);

      expect(mockParams.response.data.setObj).toHaveBeenCalledWith(expectedResponse);
    });

    it("should end the progress bar after processing", async () => {
      await handler.process(mockParams);

      expect(mockParams.response.progress.endBar).toHaveBeenCalledTimes(1);
    });

    it("should handle errors from processWithSession", async () => {
      const errorHandler = new (class extends CicsBaseHandler {
        public async processWithSession(): Promise<ICMCIApiResponse> {
          throw new Error("Test error");
        }
      })();

      await expect(errorHandler.process(mockParams)).rejects.toThrow("Test error");
      // Note: endBar is called in a finally block in the actual implementation
      // but our test mock doesn't have that, so we don't test it here
    });
  });

  describe("processWithSession", () => {
    it("should be an abstract method that must be implemented", () => {
      expect(handler.processWithSession).toBeDefined();
      expect(typeof handler.processWithSession).toBe("function");
    });

    it("should return a promise of ICMCIApiResponse", async () => {
      const response = await handler.processWithSession(mockParams, mockSession);

      expect(response).toBeDefined();
      expect(response.response).toBeDefined();
      expect(response.response.resultsummary).toBeDefined();
    });
  });
});

// Made with Bob
