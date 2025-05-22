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

import { ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { IProfile, Session } from "@zowe/imperative";
import { imperative } from "@zowe/zowe-explorer-api";
import * as filterUtils from "../../src/utils/filterUtils";
import * as resourceUtils from "../../src/utils/resourceUtils";
import * as vscode from "vscode";

jest.mock("@zowe/cics-for-zowe-sdk");
export const zoweSdkMock = require("@zowe/cics-for-zowe-sdk");
export const toEscapedCriteriaString = jest.spyOn(filterUtils, "toEscapedCriteriaString");
export const getResourceMock = jest.spyOn(resourceUtils, "runGetResource");

export const CICSProfileMock = {
  host: "hostname",
  port: "123",
  user: "a",
  password: "b",
  rejectUnauthorized: false,
  protocol: "http",
};

export const imperativeSession: Session = new Session({
  user: "user",
  password: "pwd",
  hostname: "hostname",
  protocol: "https",
  type: "basic",
  rejectUnauthorized: false,
});

const IProfileMock: IProfile = {
  cicsPlex: "PLEXX",
  regionName: "IYK2ZXXX",
};

const profile: imperative.IProfileLoaded = {
  message: "",
  type: "type",
  failNotFound: false,
  profile: IProfileMock,
};

export const CICSPlexTree = {
  getProfile: () => profile,
  getParent: () => CICSSessionTreeMock,
};

export const CICSSessionTreeMock = {
  session: imperativeSession,
  getSession: () => imperativeSession,
  getProfile: () => IProfileMock,
};

export const cicsRegionTreeMock = {
  parentSession: CICSSessionTreeMock,
  getRegionName: () => "IYK2ZXXX",
  parentPlex: {
    getPlexName: () => "PLEXX",
  },
};

export const ICMCIApiResponseMock: ICMCIApiResponse = {
  response: {
    resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
    records: {},
  },
};

export function getDummyTreeResources(resourceName: string, defaultCriteria: string, iconPath?: string) {
  return {
    iconPath: iconPath ? "/icon/path" : iconPath,
    resourceName: resourceName,
    defaultCriteria: defaultCriteria,
  };
}

export const workspaceMock = jest.spyOn(vscode.workspace, "getConfiguration");
export const get = jest.fn();
export const workspaceConfiguration = {
  get: get,
  update: jest.fn(),
  isFile: jest.fn().mockReturnValue(true),
};
