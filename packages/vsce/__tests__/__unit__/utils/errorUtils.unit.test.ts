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

const getMetasMock = jest.fn();

import { URLConstants } from "../../../src/errors/urlConstants";
import {
  getEIBFNameFromMetas,
  getErrorCode,
  getHelpTopicNameFromMetas,
  convertErrorToIncompleteResponse,
  hasRecordsWithData
} from "../../../src/utils/errorUtils";

jest.mock("../../../src/doc", () => ({
  getMetas: getMetasMock,
}));

const mockMetas = [
  {
    eibfnName: "LIBRARY",
    setCommandDocFile: "dfha8_setlibrary.html",
    anchorFragmentForSet: "setlibrary1__conditions__title__1",
  },
  {
    eibfnName: "PROGRAM",
    setCommandDocFile: "dfha8_setprogram.html",
    anchorFragmentForSet: "dfha8fq__title__6",
  },
];

describe("Test suite for errorUtils", () => {
  describe("Tests for getErrorCode()", () => {
    it("should return error code from mDetails.errorCode", () => {
      const error = {
        mDetails: {
          errorCode: "404",
        },
      };
      expect(getErrorCode(error)).toBe("404");
    });

    it("should return error code from response.status when mDetails.errorCode is not available", () => {
      const error = {
        response: {
          status: 500,
        },
      };
      expect(getErrorCode(error)).toBe(500);
    });

    it("should return undefined when neither mDetails.errorCode nor response.status is available", () => {
      const error = {};
      expect(getErrorCode(error)).toBeUndefined();
    });
  });

  describe("Tests for getHelpTopicNameFromMetas()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      getMetasMock.mockReturnValue(mockMetas);
    });

    it("should return GET_COMMAND_DOC_FILE for 'get' resource type", () => {
      expect(getHelpTopicNameFromMetas("get")).toEqual({ docFile: URLConstants.GET_COMMAND_DOC_FILE, anchor: URLConstants.GET_COMMAND_URI_FRAGMENT });
    });

    it("should return GET_COMMAND_DOC_FILE for URLConstants.GET_RESOURCE", () => {
      expect(getHelpTopicNameFromMetas(URLConstants.GET_RESOURCE)).toEqual({
        docFile: URLConstants.GET_COMMAND_DOC_FILE,
        anchor: URLConstants.GET_COMMAND_URI_FRAGMENT
      });
    });

    it("should return docFile and fragment for LIBRARY resource type", () => {
      expect(getHelpTopicNameFromMetas("library")).toEqual({ docFile: "dfha8_setlibrary.html", anchor: "setlibrary1__conditions__title__1" });
    });

    it("should return docFile and fragment for PROGRAM resource type", () => {
      expect(getHelpTopicNameFromMetas("program")).toEqual({ docFile: "dfha8_setprogram.html", anchor: "dfha8fq__title__6" });
    });

    it("should return undefined for unknown resource type", () => {
      expect(getHelpTopicNameFromMetas("unknown")).toBeUndefined();
    });

    it("should return undefined when resourceType is undefined", () => {
      expect(getHelpTopicNameFromMetas(undefined as any)).toBeUndefined();
    });

    it("should return undefined when meta has no docFile", () => {
      getMetasMock.mockReturnValue([
        {
          eibfnName: "TEST",
          setCommandDocFile: undefined,
          anchorFragmentForSet: "test",
        },
      ]);
      expect(getHelpTopicNameFromMetas("test")).toBeUndefined();
    });
  });

  describe("Tests for getEIBFNameFromMetas()", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      getMetasMock.mockReturnValue(mockMetas);
    });

    it("should return eibfnName for LIBRARY", () => {
      expect(getEIBFNameFromMetas("library")).toBe("LIBRARY");
    });

    it("should return eibfnName for PROGRAM", () => {
      expect(getEIBFNameFromMetas("program")).toBe("PROGRAM");
    });

    it("should return undefined when eibfnAlt is undefined", () => {
      expect(getEIBFNameFromMetas(undefined as any)).toBeUndefined();
    });

    it("should return undefined when eibfnAlt is empty string", () => {
      expect(getEIBFNameFromMetas("")).toBeUndefined();
    });
  });


  describe("Tests for hasRecordsWithData()", () => {
    it("should return false when records is null", () => {
      expect(hasRecordsWithData(null)).toBe(false);
    });

    it("should return false when records is undefined", () => {
      expect(hasRecordsWithData(undefined)).toBe(false);
    });

    it("should return false when records is not an object", () => {
      expect(hasRecordsWithData("string")).toBe(false);
      expect(hasRecordsWithData(123)).toBe(false);
      expect(hasRecordsWithData(true)).toBe(false);
    });

    it("should return false when records is empty object", () => {
      expect(hasRecordsWithData({})).toBe(false);
    });

    it("should return false when records has no arrays", () => {
      expect(hasRecordsWithData({ key: "value" })).toBe(false);
    });

    it("should return false when records has only empty arrays", () => {
      expect(hasRecordsWithData({ program: [] })).toBe(false);
    });

    it("should return true when records has non-empty array", () => {
      expect(hasRecordsWithData({ program: [{ name: "PROG1" }] })).toBe(true);
    });

    it("should return true when at least one array is non-empty", () => {
      expect(hasRecordsWithData({
        program: [],
        transaction: [{ name: "TXN1" }]
      })).toBe(true);
    });
  });


  describe("Tests for convertErrorToIncompleteResponse()", () => {
    it("should return null when error has no incomplete results", () => {
      const error = { message: "Some error" };
      expect(convertErrorToIncompleteResponse(error)).toBeNull();
    });

    it("should return null when error is null", () => {
      expect(convertErrorToIncompleteResponse(null)).toBeNull();
    });

    it("should return null when error is undefined", () => {
      expect(convertErrorToIncompleteResponse(undefined)).toBeNull();
    });

    it("should return null when error has no resultSummary", () => {
      const error = {
        records: {
          cicsprogram: [{ program: "PROG1" }]
        }
      };
      expect(convertErrorToIncompleteResponse(error)).toBeNull();
    });

    it("should return null when error has empty records", () => {
      const error = {
        records: {},
        resultSummary: {
          api_function: "GET",
          api_response1: "1031",
          api_response1_alt: "NOTPERMIT"
        }
      };
      expect(convertErrorToIncompleteResponse(error)).toBeNull();
    });

    it("should return null when records has only empty arrays", () => {
      const error = {
        records: {
          cicsprogram: [] as any[]
        },
        resultSummary: {
          api_function: "GET",
          api_response1: "1031",
          api_response1_alt: "NOTPERMIT"
        }
      };
      expect(convertErrorToIncompleteResponse(error)).toBeNull();
    });

    it("should return ICMCIApiResponse when error has incomplete results", () => {
      const error = {
        records: {
          cicsprogram: [{ program: "PROG1" }]
        },
        resultSummary: {
          api_function: "GET",
          api_response1: "1031",
          api_response1_alt: "NOTPERMIT",
          api_response2: "0",
          api_response2_alt: "USRID"
        },
        errors: { feedback: { resp: "16" } }
      };
      const response = convertErrorToIncompleteResponse(error);
      expect(response).not.toBeNull();
      expect(response?.response.resultsummary).toEqual(error.resultSummary);
      expect(response?.response.records).toEqual(error.records);
      expect(response?.response.errors).toEqual(error.errors);
    });

    it("should return ICMCIApiResponse when error has incomplete results without errors field", () => {
      const error = {
        records: {
          cicsprogram: [{ program: "PROG1" }]
        },
        resultSummary: {
          api_function: "GET",
          api_response1: "1031",
          api_response1_alt: "NOTPERMIT",
          api_response2: "0",
          api_response2_alt: "USRID"
        }
      };
      const response = convertErrorToIncompleteResponse(error);
      expect(response).not.toBeNull();
      expect(response?.response.resultsummary).toEqual(error.resultSummary);
      expect(response?.response.records).toEqual(error.records);
      expect(response?.response.errors).toBeUndefined();
    });
  });

});
