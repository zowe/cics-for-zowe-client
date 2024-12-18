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

import { Session } from "@zowe/imperative";
import {
  CicsCmciConstants,
  CicsCmciRestClient,
  getCache,
  ICacheParms,
  ICMCIApiResponse
} from "../../../src";

describe("CMCI - Get Cache", () => {
  const content: ICMCIApiResponse = {
    response: {
      resultsummary: {
        api_response1: "1024",
        api_response2: "0",
        api_response1_alt: "OK",
        api_response2_alt: "",
        recordcount: "1",
        cachetoken: "E0252A3D2292C613",
        displayed_recordcount: "1",
      },
      records: []
    }
  };
  const dummySession = new Session({
    user: "fake",
    password: "fake",
    hostname: "fake",
    port: 1490
  });

  let error: any;
  let response: any;
  let endPoint: string;
  let cacheParms: ICacheParms;


  describe("validation", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
    });

    it("should throw error if no parms are defined", async () => {
      try {
        response = await getCache(dummySession, undefined);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toMatch(/(Cannot read).*undefined/);
    });

    it("should throw error if cache token is not defined", async () => {
      try {
        response = await getCache(dummySession, { cacheToken: undefined });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS Result Cache Token is required");
    });

    it("should throw error if cache token is missing", async () => {
      try {
        response = await getCache(dummySession, { cacheToken: "" });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Required parameter 'CICS Result Cache Token' must not be blank");
    });
  });

  describe("success scenarios", () => {

    const cmciGetSpy = jest.spyOn(CicsCmciRestClient, "getExpectParsedXml").mockResolvedValue(content);

    beforeEach(() => {
      response = undefined;
      error = undefined;
      cacheParms = {
        cacheToken: "E0252A3D2292C613",
      };
      cmciGetSpy.mockClear();
      cmciGetSpy.mockResolvedValue(content);
    });

    it("should be able to get a result cache", async () => {
      try {
        response = await getCache(dummySession, cacheParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" + CicsCmciConstants.CICS_RESULT_CACHE +
        "/" + cacheParms.cacheToken + "?" + CicsCmciConstants.NO_DISCARD;

      expect(response).toEqual(content);
      expect(cmciGetSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a result cache with SUMMONLY", async () => {
      try {
        cacheParms.summonly = true;
        response = await getCache(dummySession, cacheParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" + CicsCmciConstants.CICS_RESULT_CACHE +
        "/" + cacheParms.cacheToken + "?" + CicsCmciConstants.NO_DISCARD +
        "&" + CicsCmciConstants.SUMM_ONLY;

      expect(response).toEqual(content);
      expect(cmciGetSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a result cache with start index", async () => {
      try {
        cacheParms.startIndex = 10;
        response = await getCache(dummySession, cacheParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" + CicsCmciConstants.CICS_RESULT_CACHE +
        "/" + cacheParms.cacheToken + "/" +
        "10?" + CicsCmciConstants.NO_DISCARD;

      expect(response).toEqual(content);
      expect(cmciGetSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a result cache with start index and count", async () => {
      try {
        cacheParms.startIndex = 15;
        cacheParms.count = 5;
        response = await getCache(dummySession, cacheParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" + CicsCmciConstants.CICS_RESULT_CACHE +
        "/" + cacheParms.cacheToken + "/" +
        "15/5?" + CicsCmciConstants.NO_DISCARD;

      expect(response).toEqual(content);
      expect(cmciGetSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a result cache without NODISCARD", async () => {
      try {
        cacheParms.nodiscard = false;
        response = await getCache(dummySession, cacheParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" + CicsCmciConstants.CICS_RESULT_CACHE +
        "/" + cacheParms.cacheToken;

      expect(response).toEqual(content);
      expect(cmciGetSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });
  });
});
