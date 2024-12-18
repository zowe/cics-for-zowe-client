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
  getResource,
  ICMCIApiResponse,
  IResourceParms
} from "../../../src";

describe("CMCI - Get resource", () => {

  const resource = "resource";
  const region = "region";
  const cicsPlex = "plex";
  const criteria = "program=D*";
  const content = "This\nis\r\na\ntest" as unknown as ICMCIApiResponse;

  const dummySession = new Session({
    user: "fake",
    password: "fake",
    hostname: "fake",
    port: 1490
  });

  let error: any;
  let response: any;
  let endPoint: string;
  let resourceParms: IResourceParms;


  describe("validation", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
      resourceParms = {
        regionName: region,
        name: resource,
        criteria: undefined,
        cicsPlex: undefined
      };
    });

    it("should throw error if no parms are defined", async () => {
      try {
        response = await getResource(dummySession, undefined);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toMatch(/(Cannot read).*undefined/);
    });

    it("should throw error if resource name is not defined", async () => {
      try {
        response = await getResource(dummySession, {
          regionName: "fake",
          name: undefined,
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS resource name is required");
    });

    it("should throw error if resource name is missing", async () => {
      try {
        response = await getResource(dummySession, {
          regionName: "fake",
          name: ""
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Required parameter 'CICS Resource name' must not be blank");
    });
  });

  describe("success scenarios", () => {

    const deleteSpy = jest.spyOn(CicsCmciRestClient, "getExpectParsedXml").mockResolvedValue(content);

    beforeEach(() => {
      response = undefined;
      error = undefined;
      resourceParms = {
        regionName: region,
        name: resource,
        criteria: undefined,
        cicsPlex: undefined
      };
      deleteSpy.mockClear();
      deleteSpy.mockResolvedValue(content);
    });

    it("should be able to get a resource without CICS Region name being defined", async () => {
      try {
        resourceParms.regionName = undefined;
        response = await getResource(dummySession, resourceParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" +
       resource + "/";

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource without CICS Region name being specified", async () => {
      try {
        resourceParms.regionName = "";
        response = await getResource(dummySession, resourceParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" +
       resource + "/";

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource without cicsPlex specified", async () => {
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource +
                "/" + region;

      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource without criteria specified", async () => {
      resourceParms.criteria = undefined;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource +
                "/" + region;

      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with cicsPlex specified and criteria not specified", async () => {
      resourceParms.cicsPlex = cicsPlex;
      resourceParms.criteria = undefined;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" +  resource +
                "/" + cicsPlex + "/" + region;

      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with criteria specified", async () => {
      resourceParms.cicsPlex = undefined;
      resourceParms.criteria = criteria;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" +  resource +
                "/" + region + "?CRITERIA=(" + encodeURIComponent(resourceParms.criteria) + ")";
      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with SUMMONLY specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        summonly: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?SUMMONLY`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with NODISCARD specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        nodiscard: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?NODISCARD`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with OVERRIDEWARNINGCOUNT specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        overrideWarningCount: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?OVERRIDEWARNINGCOUNT`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with all query params specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        overrideWarningCount: true,
        summonly: true,
        nodiscard: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?SUMMONLY&NODISCARD&OVERRIDEWARNINGCOUNT`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with no context and all query params specified", async () => {
      resourceParms.cicsPlex = undefined;
      resourceParms.regionName = undefined;
      resourceParms.queryParams = {
        overrideWarningCount: true,
        summonly: true,
        nodiscard: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/?SUMMONLY&NODISCARD&OVERRIDEWARNINGCOUNT`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toContain(content);
      expect(deleteSpy).toHaveBeenCalledWith(dummySession, endPoint, []);
    });
  });
});
