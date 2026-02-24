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

import type { IGetResourceUriOptions } from "../../../src";
import type { IResultCacheParms } from "../../../src/doc/IResultCacheParms";
import { Utils } from "../../../src/utils";

describe("Utils - getResourceUri", () => {
  let error: any;
  let response: any;

  describe("validation", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
    });

    it("should throw error if resourceName is empty", async () => {
      try {
        response = Utils.getResourceUri("");
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: Required parameter 'CICS Resource name' must not be blank");
    });

    it("should throw error if resourceName is undefined", async () => {
      try {
        response = Utils.getResourceUri(undefined);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: CICS resource name is required");
    });

    it("should throw error if resourceName is null", async () => {
      try {
        response = Utils.getResourceUri(null);
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
        response = Utils.getResourceUri("resource1");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/");
    });

    it("should be able to get a resource uri with the cicsplex and resource name specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/");
    });

    it("should be able to get a resource uri with the region and resource names specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "",
          regionName: "region1",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1//region1");
    });

    it("should be able to get a resource uri with the region containing #", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "",
          regionName: "region#",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1//region%23");
    });

    it("should be able to get a resource uri with the plex name containing #", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex#",
          regionName: "",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex%23/");
    });

    it("should be able to get a resource uri with the plex, region and resource names specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with the criteria is unspecified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          criteria: "",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with the criteria is specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          criteria: "NAME=test",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?CRITERIA=(NAME%3Dtest)");
    });

    it("should be able to get a resource uri with the parameter is unspecified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          criteria: "",
          parameter: "",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with the parameter is specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          criteria: "",
          parameter: "PARAM=test",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?PARAMETER=PARAM%3Dtest");
    });

    it("should be able to get a resource uri when both criteria and parameter are specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          criteria: "NAME=test1",
          parameter: "PARAM=test2",
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?CRITERIA=(NAME%3Dtest1)&PARAMETER=PARAM%3Dtest2");
    });

    it("should be able to get a resource uri with SUMMONLY specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          queryParams: {
            summonly: true,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?SUMMONLY");
    });

    it("should be able to get a resource uri with SUMMONLY specified to false", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          queryParams: {
            summonly: false,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with NODISCARD specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          queryParams: {
            nodiscard: true,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?NODISCARD");
    });

    it("should be able to get a resource uri with NODISCARD specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          queryParams: {
            nodiscard: false,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with OVERRIDEWARNINGCOUNT specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          queryParams: {
            overrideWarningCount: true,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?OVERRIDEWARNINGCOUNT");
    });

    it("should be able to get a resource uri with OVERRIDEWARNINGCOUNT specified to false", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          queryParams: {
            overrideWarningCount: false,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1");
    });

    it("should be able to get a resource uri with all query params specified", async () => {
      try {
        const options: IGetResourceUriOptions = {
          cicsPlex: "cicsplex1",
          regionName: "region1",
          queryParams: {
            summonly: true,
            nodiscard: true,
            overrideWarningCount: true,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/cicsplex1/region1?SUMMONLY&NODISCARD&OVERRIDEWARNINGCOUNT");
    });

    it("should be able to get a resource uri with all query params specified and no context", async () => {
      try {
        const options: IGetResourceUriOptions = {
          queryParams: {
            summonly: true,
            nodiscard: true,
            overrideWarningCount: true,
          },
        };

        response = Utils.getResourceUri("resource1", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/resource1/?SUMMONLY&NODISCARD&OVERRIDEWARNINGCOUNT");
    });
  });
});

describe("Utils - enforceParentheses", () => {
  it("should add brackets when none exist", () => {
    const output = Utils.enforceParentheses("input");
    expect(output).toEqual("(input)");
  });

  it("should add first bracket when end exists", () => {
    const output = Utils.enforceParentheses("input with spaces)");
    expect(output).toEqual("(input with spaces))");
  });

  it("should add last bracket when first exists", () => {
    const output = Utils.enforceParentheses("(input with spec1@| characters");
    expect(output).toEqual("(input with spec1@| characters");
  });

  it("should do nothing when both brackets exist", () => {
    const output = Utils.enforceParentheses("(fully covered)");
    expect(output).toEqual("(fully covered)");
  });

  it("should do nothing when multiple brackets exist", () => {
    const output = Utils.enforceParentheses("((()))");
    expect(output).toEqual("((()))");
  });

  it("should add appropriate brackets", () => {
    const output = Utils.enforceParentheses(
      "NOT (PROGRAM=CEE* OR PROGRAM=DFH* OR PROGRAM=CJ* OR PROGRAM=EYU* OR PROGRAM=CSQ* OR PROGRAM=CEL* OR PROGRAM=IGZ*)"
    );
    expect(output).toEqual("(NOT (PROGRAM=CEE* OR PROGRAM=DFH* OR PROGRAM=CJ* OR PROGRAM=EYU* OR PROGRAM=CSQ* OR PROGRAM=CEL* OR PROGRAM=IGZ*))");
  });
});

describe("Utils - getCacheUri", () => {
  let error: any;
  let response: any;

  describe("validation", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
    });

    it("should throw error if cacheToken is empty", async () => {
      try {
        response = Utils.getCacheUri("");
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: Required parameter 'CICS Results Cache Token' must not be blank");
    });

    it("should throw error if cacheToken is undefined", async () => {
      try {
        response = Utils.getCacheUri(undefined);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: CICS Results Cache Token is required");
    });

    it("should throw error if cacheToken is null", async () => {
      try {
        response = Utils.getCacheUri(null);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toEqual("Expect Error: CICS Results Cache Token is required");
    });
  });

  describe("success scenarios", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
    });

    it("should be able to get a result cache uri with only the cache token specified", async () => {
      try {
        response = Utils.getCacheUri("abcdefg");
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/CICSResultCache/abcdefg?NODISCARD");
    });

    it("should be able to get a result cache with the index specified", async () => {
      try {
        const options: IResultCacheParms = {
          startIndex: 1,
        };

        response = Utils.getCacheUri("abcdefgh", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/CICSResultCache/abcdefgh/1?NODISCARD");
    });

    it("should be able to get a result cache with the count specified - ignored with no index", async () => {
      try {
        const options: IResultCacheParms = {
          count: 20,
        };

        response = Utils.getCacheUri("cachetoken", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/CICSResultCache/cachetoken?NODISCARD");
    });

    it("should be able to get a result cache with the index and count specified", async () => {
      try {
        const options: IResultCacheParms = {
          startIndex: 10,
          count: 20,
        };

        response = Utils.getCacheUri("cachetoken", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/CICSResultCache/cachetoken/10/20?NODISCARD");
    });

    it("should be able to get a result cache with SUMMONLY", async () => {
      try {
        const options: IResultCacheParms = {
          summonly: true,
        };

        response = Utils.getCacheUri("abcdef", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/CICSResultCache/abcdef?NODISCARD&SUMMONLY");
    });

    it("should be able to get a result cache and with false NODISCARD", async () => {
      try {
        const options: IResultCacheParms = {
          nodiscard: false,
        };

        response = Utils.getCacheUri("abcdef", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/CICSResultCache/abcdef");
    });

    it("should be able to get a result cache and with summonly but not nodiscard", async () => {
      try {
        const options: IResultCacheParms = {
          summonly: true,
          nodiscard: false,
        };

        response = Utils.getCacheUri("abcdef", options);
      } catch (err) {
        error = err;
      }

      expect(response).toBeDefined();
      expect(error).toBeUndefined();
      expect(response).toEqual("/CICSSystemManagement/CICSResultCache/abcdef?SUMMONLY");
    });
  });
});
