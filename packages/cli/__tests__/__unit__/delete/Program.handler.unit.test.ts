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

import { type ICMCIApiResponse, deleteProgram } from "@zowe/cics-for-zowe-sdk";
import { type AbstractSession, type IHandlerParameters } from "@zowe/imperative";
import ProgramHandler from "../../../src/delete/program/Program.handler";

// Mock the SDK
jest.mock("@zowe/cics-for-zowe-sdk");

describe("Delete Program Handler", () => {
  let handler: ProgramHandler;
  let mockParams: IHandlerParameters;
  let mockSession: AbstractSession;
  let mockResponse: ICMCIApiResponse;

  beforeEach(() => {
    handler = new ProgramHandler();

    // Mock response
    mockResponse = {
      response: {
        resultsummary: {
          api_response1: "1024",
          api_response2: "0",
          recordcount: "1",
          displayed_recordcount: "1",
        },
        records: {
          cicsProgram: [
            {
              _keydata: "C1D7D7D3F0F0F0F1",
              name: "APPL0001",
            },
          ],
        },
      },
    };

    // Mock handler parameters
    mockParams = {
      arguments: {
        $0: "zowe",
        _: ["cics", "delete", "program"],
        programName: "TESTPROG",
        csdGroup: "TESTGRP",
        regionName: "TESTRGN",
        cicsPlex: "TESTPLEX",
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

    // Mock deleteProgram
    (deleteProgram as jest.Mock).mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("processWithSession", () => {
    it("should call deleteProgram with correct parameters", async () => {
      await handler.processWithSession(mockParams, mockSession);

      expect(deleteProgram).toHaveBeenCalledWith(mockSession, {
        name: "TESTPROG",
        csdGroup: "TESTGRP",
        regionName: "TESTRGN",
        cicsPlex: "TESTPLEX",
      });
    });

    it("should start a progress bar", async () => {
      await handler.processWithSession(mockParams, mockSession);

      expect(mockParams.response.progress.startBar).toHaveBeenCalledWith({
        task: expect.objectContaining({
          statusMessage: "Deleting program from CICS",
          percentComplete: 0,
        }),
      });
    });

    it("should log success message", async () => {
      await handler.processWithSession(mockParams, mockSession);

      expect(mockParams.response.console.log).toHaveBeenCalledWith(
        expect.stringContaining("successfully"),
        "TESTPROG"
      );
    });

    it("should return the API response", async () => {
      const response = await handler.processWithSession(mockParams, mockSession);

      expect(response).toEqual(mockResponse);
    });

    it("should handle errors from deleteProgram", async () => {
      const error = new Error("Failed to delete program");
      (deleteProgram as jest.Mock).mockRejectedValue(error);

      await expect(handler.processWithSession(mockParams, mockSession)).rejects.toThrow(
        "Failed to delete program"
      );
    });

    it("should work without optional cicsPlex parameter", async () => {
      const paramsWithoutPlex = {
        ...mockParams,
        arguments: {
          ...mockParams.arguments,
          cicsPlex: undefined as string | undefined,
        },
      };

      await handler.processWithSession(paramsWithoutPlex, mockSession);

      expect(deleteProgram).toHaveBeenCalledWith(mockSession, {
        name: "TESTPROG",
        csdGroup: "TESTGRP",
        regionName: "TESTRGN",
        cicsPlex: undefined,
      });
    });

    it("should work without optional regionName parameter", async () => {
      const paramsWithoutRegion = {
        ...mockParams,
        arguments: {
          ...mockParams.arguments,
          regionName: undefined as string | undefined,
        },
      };

      await handler.processWithSession(paramsWithoutRegion, mockSession);

      expect(deleteProgram).toHaveBeenCalledWith(mockSession, {
        name: "TESTPROG",
        csdGroup: "TESTGRP",
        regionName: undefined,
        cicsPlex: "TESTPLEX",
      });
    });
  });
});
