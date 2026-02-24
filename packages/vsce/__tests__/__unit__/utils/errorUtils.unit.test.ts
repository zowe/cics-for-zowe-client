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
import { getEIBFNameFromMetas, getErrorCode, getHelpTopicNameFromMetas } from "../../../src/utils/errorUtils";

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
  });
});
