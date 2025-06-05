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
import { UrimapClientDefinition } from "../../../../src/define/urimap-client/UrimapClient.definition";
import UrimapClientHandler from "../../../../src/define/urimap-client/UrimapClient.handler";

jest.mock("@zowe/cics-for-zowe-sdk");
const Define = require("@zowe/cics-for-zowe-sdk");

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
  positionals: ["cics", "define", "urimap-client"],
  definition: UrimapClientDefinition,
  arguments: PROFILE_MAP,
});

describe("DefineUrimapClientHandler", () => {
  const regionName = "testRegion";
  const csdGroup = "testGroup";
  const urimapName = "testUrimap";
  const urimapHost = "testHost";
  const urimapPath = "testPath";
  const urimapScheme = "http";
  const cicsPlex = "testPlex";
  const enable = false;
  const authenticate = "BASIC";
  const certificate = "CERT01";

  const defaultReturn: ICMCIApiResponse = {
    response: {
      resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
      records: "testing",
    },
  };

  const functionSpy = jest.spyOn(Define, "defineUrimapClient");

  beforeEach(() => {
    functionSpy.mockClear();
    functionSpy.mockImplementation(async () => defaultReturn);
  });

  it("should call the defineUrimapClient api", async () => {
    const handler = new UrimapClientHandler();

    const commandParameters = { ...DEFAULT_PARAMETERS };
    commandParameters.arguments = {
      ...commandParameters.arguments,
      urimapName,
      csdGroup,
      urimapPath,
      urimapHost,
      urimapScheme,
      regionName,
      cicsPlex,
      enable,
      certificate,
      authenticate,
      host,
      port,
      user,
      password,
      rejectUnauthorized,
      protocol,
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
        name: urimapName,
        csdGroup,
        path: urimapPath,
        host: urimapHost,
        scheme: urimapScheme,
        regionName,
        cicsPlex,
        enable,
        description: undefined,
        authenticate,
        certificate,
      }
    );
  });
});
