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

import { getResourceUri } from "../../../src/methods/common";

describe("getResourceUri", () => {

  let error: any;
  let response: any;
  let endPoint: string;

  describe("validation", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
    });

    it("should throw error if resourceName is empty", async () => {
      try {
        response = getResourceUri("", "", "");
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: Required parameter 'CICS Resource name' must not be blank");
    });

    it("should throw error if resourceName is undefined", async () => {
      try {
        response = getResourceUri("", "", undefined);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: CICS resource name is required");
    });

    it("should throw error if resourceName is null", async () => {
      try {
        response = getResourceUri("", "", null);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: CICS resource name is required");
    });
  });

  describe("success scenarios", () => {

    beforeEach(() => {
      response = undefined;
      error = undefined;
    });

    it("should be able to get a resource uri with only the resource name specified", async () => {
      try {
        response = getResourceUri("", "", "resource1");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1//");
    });

    it("should be able to get a resource uri with the cicsplex and resource name specified", async () => {
      try {
        response = getResourceUri("cicsplex1", "", "resource1");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/");
    });

    it("should be able to get a resource uri with the region and resource names specified", async () => {
      try {
        response = getResourceUri("", "region1", "resource1");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1//region1");
    });

    it("should be able to get a resource uri with the plex, region and resource names specified", async () => {
      try {
        response = getResourceUri("cicsplex1", "region1", "resource1");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with the criteria is unspecified", async () => {
      try {
        response = getResourceUri("cicsplex1", "region1", "resource1", "");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with the criteria is specified", async () => {
      try {
        response = getResourceUri("cicsplex1", "region1", "resource1", "NAME=test");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?CRITERIA=(NAME%3Dtest)");
    });

    it("should be able to get a resource uri with the parameter is unspecified", async () => {
      try {
        response = getResourceUri("cicsplex1", "region1", "resource1", "", "");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with the parameter is specified", async () => {
      try {
        response = getResourceUri("cicsplex1", "region1", "resource1", "", "PARAM=test");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?PARAMETER=PARAM%3Dtest");
    });

    it("should be able to get a resource uri when both criteria and parameter are specified", async () => {
      try {
        response = getResourceUri("cicsplex1", "region1", "resource1", "NAME=test1", "PARAM=test2");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?CRITERIA=(NAME%3Dtest1)&PARAMETER=PARAM%3Dtest2");
    });
  });
});
