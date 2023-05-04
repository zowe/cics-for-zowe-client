/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { CommandProfiles, IHandlerParameters, IProfile, Session } from "@zowe/imperative";
import { ICMCIApiResponse } from "../../../../src";
import { WebServiceDefinition } from "../../../../src/delete/webservice/Webservice.definition";
import WebServiceHandler from "../../../../src/delete/webservice/Webservice.handler";

jest.mock("@zowe/cics-for-zowe-sdk");
const Delete = require("@zowe/cics-for-zowe-sdk");

const host = "somewhere.com";
const port = "43443";
const user = "someone";
const password = "somesecret";
const protocol = "http";
const rejectUnauthorized = false;

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
  "cics", [{
    name: "cics",
    type: "cics",
    host,
    port,
    user,
    password,
    protocol,
    rejectUnauthorized
  }]
);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);
const DEFAULT_PARAMETERS: IHandlerParameters = {
  arguments: {$0: "", _: []}, // Please provide arguments later on
  positionals: ["cics", "delete", "webservice"],
  response: {
    data: {
      setMessage: jest.fn((setMsgArgs) => {
        expect(setMsgArgs).toMatchSnapshot();
      }) as any,
      setObj: jest.fn((setObjArgs) => {
        expect(setObjArgs).toMatchSnapshot();
      }),
      setExitCode: jest.fn()
    },
    console: {
      log: jest.fn((logs) => {
        expect(logs.toString()).toMatchSnapshot();
      }) as any,
      error: jest.fn((errors) => {
        expect(errors.toString()).toMatchSnapshot();
      }) as any,
      errorHeader: jest.fn(() => undefined) as any
    },
    progress: {
      startBar: jest.fn((parms) => undefined),
      endBar: jest.fn(() => undefined)
    },
    format: {
      output: jest.fn((parms) => {
        expect(parms).toMatchSnapshot();
      })
    }
  },
  definition: WebServiceDefinition,
  fullDefinition: WebServiceDefinition,
  profiles: PROFILES
};

describe("DeleteWebserviceHandler", () => {
  const webserviceName = "testWebService";
  const regionName = "testRegion";
  const csdGroup = "testGroup";

  const defaultReturn: ICMCIApiResponse = {
    response: {
      resultsummary: {api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0"},
      records: "testing"
    }
  };

  const functionSpy = jest.spyOn(Delete, "deleteWebservice");

  beforeEach(() => {
    functionSpy.mockClear();
    functionSpy.mockImplementation(async () => defaultReturn);
  });

  it("should call the deleteWebservice api", async () => {
    const handler = new WebServiceHandler();

    const commandParameters = {...DEFAULT_PARAMETERS};
    commandParameters.arguments = {
      ...commandParameters.arguments,
      webserviceName,
      regionName,
      csdGroup,
      host,
      port,
      user,
      password,
      protocol,
      rejectUnauthorized
    };

    await handler.process(commandParameters);

    expect(functionSpy).toHaveBeenCalledTimes(1);
    const testProfile = PROFILE_MAP.get("cics")[0];
    expect(functionSpy).toHaveBeenCalledWith(
      new Session({
        type: "basic",
        hostname: testProfile.host,
        port: testProfile.port,
        user: testProfile.user,
        password: testProfile.password,
        rejectUnauthorized,
        protocol
      }),
      {
        name: webserviceName,
        csdGroup,
        regionName
      }
    );
  });
});
