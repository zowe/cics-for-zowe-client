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
import { CSDGroupDefinition } from "../../../../src/add-to-list/csdGroup/CSDGroup.definition";
import CSDGroupHandler from "../../../../src/add-to-list/csdGroup/CSDGroup.handler";

jest.mock("@zowe/cics-for-zowe-sdk");
const AddToList = require("@zowe/cics-for-zowe-sdk");

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
  positionals: ["cics", "add-to-list", "csdGroup"],
  definition: CSDGroupDefinition,
  arguments: PROFILE_MAP,
});

describe("AddToListProgramHandler", () => {
  const name = "testGroup";
  const regionName = "testRegion";
  const csdList = "testList";

  const defaultReturn: ICMCIApiResponse = {
    response: {
      resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
      records: "testing",
    },
  };

  const functionSpy = jest.spyOn(AddToList, "addCSDGroupToList");

  beforeEach(() => {
    functionSpy.mockClear();
    functionSpy.mockImplementation(async () => defaultReturn);
  });

  it("should call the addCSDGroupToList api", async () => {
    const handler = new CSDGroupHandler();

    const commandParameters = { ...DEFAULT_PARAMETERS };
    commandParameters.arguments = {
      ...commandParameters.arguments,
      name,
      regionName,
      csdList,
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
      }),
      {
        name,
        csdList,
        regionName,
      }
    );
  });
});
