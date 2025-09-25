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

import type { Extension } from "vscode";
import * as vscode from "vscode";

const successResponse = {
  response: {
    resultsummary: {
      api_response1: "",
      api_response2: "",
      displayed_recordcount: "2",
      recordcount: "2",
    },
    records: [
      {
        program: "PROG1",
        status: "ENABLED",
        newcopycnt: "0",
        eyu_cicsname: "MYREG",
        enablestatus: "ENABLED",
        progtype: "PROGRAM",
        library: "MYLIB",
        librarydsn: "MYLIBDSN",
      },
      {
        program: "PROG2",
        status: "DISABLED",
        newcopycnt: "2",
        eyu_cicsname: "MYREG",
        enablestatus: "ENABLED",
        progtype: "PROGRAM",
        library: "MYLIB",
        librarydsn: "MYLIBDSN",
      },
    ]
  }
};
const getResourceMock = jest.fn().mockReturnValue(Promise.resolve(successResponse));

const profile = {
  name: "MYPROF", failNotFound: false, message: "", type: "cics", profile: {
    protocol: "http",
    host: "hostname",
    port: 1234
  }
};

jest.mock("@zowe/cics-for-zowe-sdk", () => ({
  ...jest.requireActual("@zowe/cics-for-zowe-sdk"),
  getResource: getResourceMock,
}));

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: () => {
      return {
        loadNamedProfile: () => {
          return profile;
        }
      };
    }
  },
}));

const getExtSpy = jest.spyOn(vscode.extensions, "getExtension");

import { buildNewSession, buildRequestLoggerString, buildRequestOptions, buildResourceParms, buildUserAgentHeader, runGetResource } from "../../../src/utils/resourceUtils";
import { AuthOrder, RestClientError } from "@zowe/imperative";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import { CICSSession, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import * as errorUtils from "../../../src/utils/errorUtils";
import { SessionHandler } from "../../../src/resources";

const authOrderSpy = jest.spyOn(AuthOrder, "makingRequestForToken");
const loggerSpy = jest.spyOn(CICSLogger, "debug").mockImplementation(() => { });
const sessionHandlerSpy = jest.spyOn(SessionHandler.prototype, "getSession");

describe("Resource Util Helper methods", () => {

  beforeEach(() => {
    authOrderSpy.mockReset();
  });

  it("should build user agent string", () => {
    getExtSpy.mockReturnValue({
      packageJSON: {
        version: "1.2.3",
      }
    } as Extension<any>);

    const userAgent = buildUserAgentHeader();
    expect(userAgent).toEqual({ "User-Agent": "zowe.cics-extension-for-zowe/1.2.3 zowe.vscode-extension-for-zowe/1.2.3" });
  });

  it("builds resource params object with all specified", () => {
    const parms = buildResourceParms("MYRES", "MYREG", "MYPLEX", { criteria: "MYCRIT", parameter: "MYPARAM", queryParams: { nodiscard: true, overrideWarningCount: true, summonly: true } });
    expect(parms).toEqual({
      name: "MYRES",
      regionName: "MYREG",
      cicsPlex: "MYPLEX",
      criteria: "MYCRIT",
      parameter: "MYPARAM",
      queryParams: { nodiscard: true, overrideWarningCount: true, summonly: true }
    });
  });

  it("builds resource params object with none specified", () => {
    const parms = buildResourceParms("MYRES", "MYREG", "MYPLEX", {});
    expect(parms).toEqual({
      name: "MYRES",
      regionName: "MYREG",
      cicsPlex: "MYPLEX",
    });
  });

  it("builds resource params object with some specified", () => {
    const parms = buildResourceParms("MYRES", "MYREG", "MYPLEX", { queryParams: { nodiscard: true } });
    expect(parms).toEqual({
      name: "MYRES",
      regionName: "MYREG",
      cicsPlex: "MYPLEX",
      queryParams: { nodiscard: true },
    });
  });

  it("builds request options", () => {
    const parms = buildRequestOptions();
    expect(parms).toEqual({ failOnNoData: false, useCICSCmciRestError: true, });
  });

  it("builds new session", () => {
    const sess = buildNewSession(profile);

    expect(sess).toBeDefined();
    expect(sess?.ISession).toBeDefined();
    expect(authOrderSpy).toHaveBeenCalledTimes(1);
  });

  it("should build a GET request string with string and boolean options", () => {
    const logString = buildRequestLoggerString("GET", "MYRES", { MORE: "OPTIONS", SPECIFIED: true });
    expect(logString).toEqual("GET - Resource [MYRES], MORE [OPTIONS], SPECIFIED [true]");
  });

  it("should build a PUT request string with no options", () => {
    const logString = buildRequestLoggerString("PUT", "MYRES");
    expect(logString).toEqual("PUT - Resource [MYRES]");
  });

  it("should build a POST request string with upper and lowercase options", () => {
    const logString = buildRequestLoggerString("POST", "MYRES", { lower: "case", UPPER: "CASE" });
    expect(logString).toEqual("POST - Resource [MYRES], LOWER [case], UPPER [CASE]");
  });

});

describe("Resource Util requesters", () => {

  beforeEach(() => {
    loggerSpy.mockReset();
    authOrderSpy.mockReset();
  });

  it("should get a resource", async () => {

    let response: ICMCIApiResponse | undefined;
    let error;

    try {
      response = await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });

    } catch (err) {
      error = err;
    }

    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(`GET - Resource [MYRES]`);

    expect(getResourceMock).toHaveBeenCalledTimes(1);
    expect(authOrderSpy).toHaveBeenCalledTimes(1);

    expect(error).toBeUndefined();
    expect(response).toBeDefined();
    expect(response).toHaveProperty("response");
    expect(response?.response).toHaveProperty("resultsummary");
    expect(response?.response.resultsummary).toHaveProperty("recordcount");
  });

  it("should make a second request if first errors", async () => {

    getResourceMock.mockReset();
    const getErrorCodeMock = jest.spyOn(errorUtils, "getErrorCode");
    const errorToThrow = new RestClientError({ msg: "", source: "http", errorCode: "401" });

    const fakeCICSSession = new CICSSession(profile.profile);
    fakeCICSSession.ISession.tokenValue = '""';
    sessionHandlerSpy.mockReturnValueOnce(fakeCICSSession);

    getResourceMock.mockImplementationOnce(() => {
      throw errorToThrow;
    }).mockImplementationOnce(() => {
      return successResponse;
    });

    let response: ICMCIApiResponse | undefined;
    let error;

    try {
      response = await runGetResource({
        profileName: "MYPROF",
        resourceName: "MYRES",
      });

    } catch (err) {
      error = err;
    }

    expect(getErrorCodeMock).toHaveBeenCalledTimes(1);
    expect(getErrorCodeMock).toHaveBeenCalledWith(errorToThrow);

    expect(loggerSpy).toHaveBeenCalledTimes(2);

    expect(getResourceMock).toHaveBeenCalledTimes(2);
    expect(authOrderSpy).toHaveBeenCalledTimes(1);

    expect(error).toBeUndefined();
    expect(response).toBeDefined();
    expect(response).toHaveProperty("response");
    expect(response?.response).toHaveProperty("resultsummary");
    expect(response?.response.resultsummary).toHaveProperty("recordcount");
  });

});
