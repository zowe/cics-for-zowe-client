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

import { mockHandlerParameters } from "@zowe/cli-test-utils";
import type { IHandlerParameters } from "@zowe/imperative";
import type { ICMCIApiResponse } from "../../../src";
import LocalFileHandler from "../../../src/common/LocalFileHandler";

jest.mock("@zowe/cics-for-zowe-sdk");
const sdk = require("@zowe/cics-for-zowe-sdk");

const host = "somewhere.com";
const port = 43443;
const user = "someone";
const password = "somesecret";
const protocol = "http";
const rejectUnauthorized = false;

const PROFILE_MAP = {
  name: "cics",
  type: "cics",
  host,
  port,
  user,
  password,
};

describe("LocalFileHandler - Action Type Detection", () => {
  const fileName = "TESTFILE";
  const regionName = "testRegion";

  const defaultReturn: ICMCIApiResponse = {
    response: {
      resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
      records: "testing",
    },
  };

  const closeSpy = jest.spyOn(sdk, "closeLocalFile");
  const openSpy = jest.spyOn(sdk, "openLocalFile");

  beforeEach(() => {
    closeSpy.mockClear();
    openSpy.mockClear();
    closeSpy.mockImplementation(async () => defaultReturn);
    openSpy.mockImplementation(async () => defaultReturn);
  });

  describe("Action detection via positionals array", () => {
    it("should detect CLOSE action from positionals array", async () => {
      const handler = new LocalFileHandler();
      
      const commandParameters: IHandlerParameters = mockHandlerParameters({
        positionals: ["cics", "close", "CICSLocalFile"],
        definition: {
          name: "CICSLocalFile",
          description: "Test command",
          type: "command",
          handler: __dirname + "/../common/LocalFileHandler",
        },
        arguments: {
          ...PROFILE_MAP,
          fileName,
          regionName,
          host,
          port,
          user,
          password,
          protocol,
          rejectUnauthorized,
        },
      });

      await handler.process(commandParameters);

      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it("should detect OPEN action from positionals array", async () => {
      const handler = new LocalFileHandler();
      
      const commandParameters: IHandlerParameters = mockHandlerParameters({
        positionals: ["cics", "open", "CICSLocalFile"],
        definition: {
          name: "CICSLocalFile",
          description: "Test command",
          type: "command",
          handler: __dirname + "/../common/LocalFileHandler",
        },
        arguments: {
          ...PROFILE_MAP,
          fileName,
          regionName,
          host,
          port,
          user,
          password,
          protocol,
          rejectUnauthorized,
        },
      });

      await handler.process(commandParameters);

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe("Action detection via handler path", () => {
    it("should detect CLOSE action from handler path with forward slash", async () => {
      const handler = new LocalFileHandler();
      
      const commandParameters: IHandlerParameters = mockHandlerParameters({
        positionals: ["cics", "CICSLocalFile"],
        definition: {
          name: "CICSLocalFile",
          description: "Test command",
          type: "command",
          handler: "/path/to/close/LocalFileHandler",
        },
        arguments: {
          ...PROFILE_MAP,
          fileName,
          regionName,
          host,
          port,
          user,
          password,
          protocol,
          rejectUnauthorized,
        },
      });

      await handler.process(commandParameters);

      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it("should detect CLOSE action from handler path with backslash", async () => {
      const handler = new LocalFileHandler();
      
      const commandParameters: IHandlerParameters = mockHandlerParameters({
        positionals: ["cics", "CICSLocalFile"],
        definition: {
          name: "CICSLocalFile",
          description: "Test command",
          type: "command",
          handler: "C:\\path\\to\\close\\LocalFileHandler",
        },
        arguments: {
          ...PROFILE_MAP,
          fileName,
          regionName,
          host,
          port,
          user,
          password,
          protocol,
          rejectUnauthorized,
        },
      });

      await handler.process(commandParameters);

      expect(closeSpy).toHaveBeenCalledTimes(1);
      expect(openSpy).not.toHaveBeenCalled();
    });

    it("should detect OPEN action from handler path with forward slash", async () => {
      const handler = new LocalFileHandler();
      
      const commandParameters: IHandlerParameters = mockHandlerParameters({
        positionals: ["cics", "CICSLocalFile"],
        definition: {
          name: "CICSLocalFile",
          description: "Test command",
          type: "command",
          handler: "/path/to/open/LocalFileHandler",
        },
        arguments: {
          ...PROFILE_MAP,
          fileName,
          regionName,
          host,
          port,
          user,
          password,
          protocol,
          rejectUnauthorized,
        },
      });

      await handler.process(commandParameters);

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(closeSpy).not.toHaveBeenCalled();
    });

    it("should detect OPEN action from handler path with backslash", async () => {
      const handler = new LocalFileHandler();
      
      const commandParameters: IHandlerParameters = mockHandlerParameters({
        positionals: ["cics", "CICSLocalFile"],
        definition: {
          name: "CICSLocalFile",
          description: "Test command",
          type: "command",
          handler: "C:\\path\\to\\open\\LocalFileHandler",
        },
        arguments: {
          ...PROFILE_MAP,
          fileName,
          regionName,
          host,
          port,
          user,
          password,
          protocol,
          rejectUnauthorized,
        },
      });

      await handler.process(commandParameters);

      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("should throw error when action type cannot be determined", async () => {
      const handler = new LocalFileHandler();
      
      const commandParameters: IHandlerParameters = mockHandlerParameters({
        positionals: ["cics", "CICSLocalFile"],
        definition: {
          name: "CICSLocalFile",
          description: "Test command",
          type: "command",
          handler: "/some/other/path/LocalFileHandler",
        },
        arguments: {
          ...PROFILE_MAP,
          fileName,
          regionName,
          host,
          port,
          user,
          password,
          protocol,
          rejectUnauthorized,
        },
      });

      await expect(handler.process(commandParameters)).rejects.toThrow(
        "Unable to determine action type from command context"
      );
    });
  });
});