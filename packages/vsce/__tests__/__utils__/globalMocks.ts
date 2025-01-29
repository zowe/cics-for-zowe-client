import { ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import * as filterUtils from "../../src/utils/filterUtils";


export const zoweSdkMock = require("@zowe/cics-for-zowe-sdk");
export const toEscapedCriteriaString = jest.spyOn(filterUtils, "toEscapedCriteriaString");
export const getResourceMock = jest.spyOn(zoweSdkMock, "getResource");

export const imperativeSession = new imperative.Session({
  user: "user",
  password: "pwd",
  hostname: "hostname",
  protocol: "https",
  type: "basic",
  rejectUnauthorized: false,
});

export const CICSSessionTreeMock = {
  session: imperativeSession,
  getSession: () => imperativeSession
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

export function getDummyTreeResources(resourceName: string, defaultCriteria: string, responseRecords: string, iconPath?: string) {
  return {
    iconPath: iconPath ? "/icon/path" : iconPath,
    resourceName: resourceName,
    defaultCriteria: defaultCriteria,
    responseRecords: responseRecords,
  };
}
