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
import { ResourceDefinition } from "../../../../src/get/resource/Resource.definition";
import ResourceHandler from "../../../../src/get/resource/Resource.handler";

jest.mock("@zowe/cics-for-zowe-sdk");
const Get = require("@zowe/cics-for-zowe-sdk");

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
  positionals: ["cics", "get", "resource"],
  definition: ResourceDefinition,
  arguments: PROFILE_MAP,
});

describe("GetResourceHandler", () => {
  const resourceName = "testResource";
  const regionName = "testRegion";

  const defaultReturn: ICMCIApiResponse = {
    response: {
      resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
      records: {},
    },
  };

  const functionSpy = jest.spyOn(Get, "getResource");

  beforeEach(() => {
    functionSpy.mockClear();
    defaultReturn.response.records[resourceName.toLowerCase()] = [{ prop: "test1" }, { prop: "test2" }];
    functionSpy.mockImplementation(async () => defaultReturn);
  });

  it("should call the getResource api", async () => {
    const handler = new ResourceHandler();

    const commandParameters = { ...DEFAULT_PARAMETERS };
    commandParameters.arguments = {
      ...commandParameters.arguments,
      resourceName,
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
        name: resourceName,
        regionName,
      }
    );
  });
});
