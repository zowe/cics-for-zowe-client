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

import { type ICMCIApiResponse, getResource } from "@zowe/cics-for-zowe-sdk";
import { type AbstractSession, type IHandlerParameters } from "@zowe/imperative";
import ResourceHandler from "../../../src/get/resource/Resource.handler";

// Mock the SDK
jest.mock("@zowe/cics-for-zowe-sdk");

describe("Get Resource Handler", () => {
  let handler: ResourceHandler;
  let mockParams: IHandlerParameters;
  let mockSession: AbstractSession;
  let mockResponse: ICMCIApiResponse;

  beforeEach(() => {
    handler = new ResourceHandler();

    // Mock response
    mockResponse = {
      response: {
        resultsummary: {
          api_response1: "1024",
          api_response2: "0",
          recordcount: "2",
          displayed_recordcount: "2",
        },
        records: {
          cicsprogram: [
            {
              _keydata: "C1D7D7D3F0F0F0F1",
              program: "APPL0001",
              status: "ENABLED",
            },
            {
              _keydata: "C1D7D7D3F0F0F0F2",
              program: "APPL0002",
              status: "DISABLED",
            },
          ],
        },
      },
    };

    // Mock handler parameters
    mockParams = {
      arguments: {
        $0: "zowe",
        _: ["cics", "get", "resource"],
        resourceName: "CICSProgram",
        regionName: "TESTRGN",
        cicsPlex: "TESTPLEX",
        criteria: "PROGRAM=APPL*",
        parameter: "STATUS",
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

    // Mock getResource
    (getResource as jest.Mock).mockResolvedValue(mockResponse);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("processWithSession", () => {
    it("should call getResource with correct parameters", async () => {
      await handler.processWithSession(mockParams, mockSession);

      expect(getResource).toHaveBeenCalledWith(mockSession, {
        name: "CICSProgram",
        regionName: "TESTRGN",
        cicsPlex: "TESTPLEX",
        criteria: "PROGRAM=APPL*",
        parameter: "STATUS",
      });
    });

    it("should start a progress bar", async () => {
      await handler.processWithSession(mockParams, mockSession);

      expect(mockParams.response.progress.startBar).toHaveBeenCalledWith({
        task: expect.objectContaining({
          statusMessage: "Getting resources from CICS",
          percentComplete: 0,
        }),
      });
    });

    it("should format and output the response records", async () => {
      await handler.processWithSession(mockParams, mockSession);

      expect(mockParams.response.format.output).toHaveBeenCalledWith({
        fields: [],
        format: "object",
        output: mockResponse.response.records.cicsprogram,
      });
    });

    it("should return the API response", async () => {
      const response = await handler.processWithSession(mockParams, mockSession);

      expect(response).toEqual(mockResponse);
    });

    it("should handle errors from getResource", async () => {
      const error = new Error("Failed to get resource");
      (getResource as jest.Mock).mockRejectedValue(error);

      await expect(handler.processWithSession(mockParams, mockSession)).rejects.toThrow(
        "Failed to get resource"
      );
    });

    it("should work without optional criteria parameter", async () => {
      const paramsWithoutCriteria = {
        ...mockParams,
        arguments: {
          ...mockParams.arguments,
          criteria: undefined as string | undefined,
        },
      };

      await handler.processWithSession(paramsWithoutCriteria, mockSession);

      expect(getResource).toHaveBeenCalledWith(mockSession, {
        name: "CICSProgram",
        regionName: "TESTRGN",
        cicsPlex: "TESTPLEX",
        criteria: undefined,
        parameter: "STATUS",
      });
    });

    it("should work without optional parameter parameter", async () => {
      const paramsWithoutParameter = {
        ...mockParams,
        arguments: {
          ...mockParams.arguments,
          parameter: undefined as string | undefined,
        },
      };

      await handler.processWithSession(paramsWithoutParameter, mockSession);

      expect(getResource).toHaveBeenCalledWith(mockSession, {
        name: "CICSProgram",
        regionName: "TESTRGN",
        cicsPlex: "TESTPLEX",
        criteria: "PROGRAM=APPL*",
        parameter: undefined,
      });
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

      expect(getResource).toHaveBeenCalledWith(mockSession, {
        name: "CICSProgram",
        regionName: "TESTRGN",
        cicsPlex: undefined,
        criteria: "PROGRAM=APPL*",
        parameter: "STATUS",
      });
    });

    it("should handle lowercase resource names in output", async () => {
      const lowerCaseResponse = {
        ...mockResponse,
        response: {
          ...mockResponse.response,
          records: {
            cicslocalfile: [
              {
                file: "FILE001",
                status: "ENABLED",
              },
            ],
          },
        },
      };

      (getResource as jest.Mock).mockResolvedValue(lowerCaseResponse);

      const paramsWithFile = {
        ...mockParams,
        arguments: {
          ...mockParams.arguments,
          resourceName: "CICSLocalFile",
        },
      };

      await handler.processWithSession(paramsWithFile, mockSession);

      expect(mockParams.response.format.output).toHaveBeenCalledWith({
        fields: [],
        format: "object",
        output: lowerCaseResponse.response.records.cicslocalfile,
      });
    });
  });
});
