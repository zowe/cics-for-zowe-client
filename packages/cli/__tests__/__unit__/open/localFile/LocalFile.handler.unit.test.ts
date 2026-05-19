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
import { type IHandlerParameters, Session } from "@zowe/imperative";
import type { ICMCIApiResponse } from "../../../../src";
import LocalFileHandler from "../../../../src/common/LocalFileHandler";

// Import the Open command group definition
const OpenDefinition = require("../../../../src/open/Open.definition");
const LocalFileDefinition = OpenDefinition.children![0];

// Set up parent relationship for the handler to determine action type
LocalFileDefinition.parent = OpenDefinition;

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
const DEFAULT_PARAMETERS: IHandlerParameters = mockHandlerParameters({
  positionals: ["cics", "open", "CICSLocalFile"],
  definition: LocalFileDefinition,
  arguments: PROFILE_MAP,
});

describe("OpenLocalFileHandler", () => {
  const fileName = "TESTFILE";
  const regionName = "testRegion";
  const cicsPlex = "testPlex";

  const defaultReturn: ICMCIApiResponse = {
    response: {
      resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
      records: "testing",
    },
  };

  const functionSpy = jest.spyOn(sdk, "openLocalFile");

  beforeEach(() => {
    functionSpy.mockClear();
    functionSpy.mockImplementation(async () => defaultReturn);
  });

  it("should call the openLocalFile api", async () => {
    const handler = new LocalFileHandler();

    const commandParameters = { ...DEFAULT_PARAMETERS };
    commandParameters.arguments = {
      ...commandParameters.arguments,
      fileName,
      regionName,
      host,
      port,
      user,
      password,
      protocol,
      rejectUnauthorized,
    };

    await handler.process(commandParameters);

    expect(functionSpy).toHaveBeenCalledTimes(1);

    expect(functionSpy).toHaveBeenCalledWith(
      new Session({
        type: "basic",
        hostname: PROFILE_MAP.host,
        port: PROFILE_MAP.port,
        user: PROFILE_MAP.user,
        password: PROFILE_MAP.password,
        rejectUnauthorized,
        protocol,
        _authCache: {
          availableCreds: {
            base64EncodedAuth: "c29tZW9uZTpzb21lc2VjcmV0",
            password: "somesecret",
            user: "someone",
          },
          didUserSetAuthOrder: false,
          topDefaultAuth: "basic",
        },
        authTypeOrder: ["basic", "token", "bearer", "cert-pem"],
      }),
      {
        name: fileName,
        regionName,
      }
    );
  });

  it("should call the openLocalFile api with cicsPlex", async () => {
    const handler = new LocalFileHandler();

    const commandParameters = { ...DEFAULT_PARAMETERS };
    commandParameters.arguments = {
      ...commandParameters.arguments,
      fileName,
      regionName,
      cicsPlex,
      host,
      port,
      user,
      password,
      protocol,
      rejectUnauthorized,
    };

    await handler.process(commandParameters);

    expect(functionSpy).toHaveBeenCalledTimes(1);

    expect(functionSpy).toHaveBeenCalledWith(
      new Session({
        type: "basic",
        hostname: PROFILE_MAP.host,
        port: PROFILE_MAP.port,
        user: PROFILE_MAP.user,
        password: PROFILE_MAP.password,
        rejectUnauthorized,
        protocol,
        _authCache: {
          availableCreds: {
            base64EncodedAuth: "c29tZW9uZTpzb21lc2VjcmV0",
            password: "somesecret",
            user: "someone",
          },
          didUserSetAuthOrder: false,
          topDefaultAuth: "basic",
        },
        authTypeOrder: ["basic", "token", "bearer", "cert-pem"],
      }),
      {
        name: fileName,
        regionName,
        cicsPlex,
      }
    );
  });

  it("should not include busy parameter for open action", async () => {
    const handler = new LocalFileHandler();

    const commandParameters = { ...DEFAULT_PARAMETERS };
    commandParameters.arguments = {
      ...commandParameters.arguments,
      fileName,
      regionName,
      busy: "WAIT", // This should be ignored for open action
      host,
      port,
      user,
      password,
      protocol,
      rejectUnauthorized,
    };

    await handler.process(commandParameters);

    expect(functionSpy).toHaveBeenCalledTimes(1);

    // Verify busy parameter is not passed to open action
    const callArgs = functionSpy.mock.calls[0][1] as any;
    expect(callArgs.busy).toBeUndefined();
  });
});


