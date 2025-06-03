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
import { IHandlerParameters, Session } from "@zowe/imperative";
import { ICMCIApiResponse } from "../../../../src";
import { ProgramDefinition } from "../../../../src/discard/program/Program.definition";
import ProgramHandler from "../../../../src/discard/program/Program.handler";

jest.mock("@zowe/cics-for-zowe-sdk");
const Discard = require("@zowe/cics-for-zowe-sdk");

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
  positionals: ["cics", "discard", "program"],
  definition: ProgramDefinition,
  arguments: PROFILE_MAP,
});

describe("DiscardProgramHandler", () => {
  const programName = "testProgram";
  const regionName = "testRegion";
  const csdGroup = "testGroup";

  const defaultReturn: ICMCIApiResponse = {
    response: {
      resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
      records: "testing",
    },
  };

  const functionSpy = jest.spyOn(Discard, "discardProgram");

  beforeEach(() => {
    functionSpy.mockClear();
    functionSpy.mockImplementation(async () => defaultReturn);
  });

  it("should call the discardProgram api", async () => {
    const handler = new ProgramHandler();

    const commandParameters = { ...DEFAULT_PARAMETERS };
    commandParameters.arguments = {
      ...commandParameters.arguments,
      programName,
      regionName,
      csdGroup,
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
        name: programName,
        regionName,
      }
    );
  });
});
