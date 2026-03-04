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
import { CicsCmciConstants, CicsCmciRestClient, type IBundleParms, type ICMCIApiResponse, defineBundle } from "../../../src";

describe("CMCI - Define bundle", () => {
  const bundle = "bundle";
  const bundleDir = "/my/bundle/dir/";
  const region = "region";
  const group = "group";
  const cicsPlex = "plex";
  const content = "This\nis\r\na\ntest" as unknown as ICMCIApiResponse;

  const defineParms: IBundleParms = {
    regionName: region,
    name: bundle,
    bundleDir,
    csdGroup: group,
    cicsPlex: undefined,
  };

  const dummySession = new Session({
    user: "fake",
    password: "fake",
    hostname: "fake",
    port: 1490,
  });

  let error: any;
  let response: any;
  let endPoint: string;

  describe("validation", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
    });

    it("should throw error if no parms are defined", async () => {
      try {
        response = await defineBundle(dummySession, undefined as any);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toMatch(/(Cannot read).*undefined/);
    });

    it("should throw error if bundle name is not defined", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: "fake",
          name: undefined as any,
          csdGroup: "fake",
          bundleDir: "fake",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS bundle name is required");
    });

    it("should throw error if CSD group is not defined", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: "fake",
          name: "fake",
          csdGroup: undefined as any,
          bundleDir: "fake",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS CSD group is required");
    });

    it("should throw error if CICS Region name is not defined", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: undefined as any,
          name: "fake",
          csdGroup: "fake",
          bundleDir: "fake",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS region name is required");
    });

    it("should throw error if CICS Bundle Dir is not defined", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: "fake",
          name: "fake",
          csdGroup: "fake",
          bundleDir: undefined as any,
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Expect Error: CICS bundle directory is required");
    });

    it("should throw error if bundle name is missing", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: "fake",
          name: "",
          csdGroup: "fake",
          bundleDir: "fake",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Required parameter 'CICS Bundle name' must not be blank");
    });

    it("should throw error if CSD group is missing", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: "fake",
          name: "fake",
          csdGroup: "",
          bundleDir: "fake",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Required parameter 'CICS CSD Group' must not be blank");
    });

    it("should throw error if CICS Region name is missing", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: "",
          name: "fake",
          csdGroup: "fake",
          bundleDir: "fake",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Required parameter 'CICS Region name' must not be blank");
    });

    it("should throw error if CICS Bundle Dir is missing", async () => {
      try {
        response = await defineBundle(dummySession, {
          regionName: "fake",
          name: "fake",
          csdGroup: "fake",
          bundleDir: "",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Expect Error: Required parameter 'CICS Bundle directory' must not be blank");
    });
  });

  describe("success scenarios", () => {
    const requestBody: any = {
      request: {
        create: {
          parameter: {
            $: {
              name: "CSD",
            },
          },
          attributes: {
            $: {
              name: bundle,
              bundleDir,
              csdgroup: group,
            },
          },
        },
      },
    };

    const defineSpy = jest.spyOn(CicsCmciRestClient, "postExpectParsedXml").mockResolvedValue(content);

    beforeEach(() => {
      response = undefined;
      error = undefined;
      defineSpy.mockClear();
      defineSpy.mockResolvedValue(content);
    });

    it("should be able to define a bundle without cicsPlex specified", async () => {
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + CicsCmciConstants.CICS_DEFINITION_BUNDLE + "/" + region;

      response = await defineBundle(dummySession, defineParms);

      // expect(response.success).toBe(true);
      expect(response).toContain(content);
      expect(defineSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });

    it("should be able to define a bundle with cicsPlex specified but empty string", async () => {
      defineParms.cicsPlex = "";
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + CicsCmciConstants.CICS_DEFINITION_BUNDLE + "//" + region;

      response = await defineBundle(dummySession, defineParms);

      // expect(response.success).toBe(true);
      expect(response).toContain(content);
      expect(defineSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });

    it("should be able to define a bundle with cicsPlex specified", async () => {
      defineParms.cicsPlex = cicsPlex;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + CicsCmciConstants.CICS_DEFINITION_BUNDLE + "/" + cicsPlex + "/" + region;

      response = await defineBundle(dummySession, defineParms);

      // expect(response.success).toBe(true);
      expect(response).toContain(content);
      expect(defineSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });
  });
});
