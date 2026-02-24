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

import { ImperativeError, RestClient, Session } from "@zowe/imperative";
import { CicsCmciConstants, CicsCmciRestError, type ICMCIApiResponse, type IResourceParms, getResource } from "../../../src";
import { nodataContent, nodataXmlResponse, ok2RecordsXmlResponse, okContent2Records } from "../../__mocks__/CmciGetResponse";

describe("CMCI - Get resource", () => {
  const resource = "CICSCICSPlex";
  const region = "REGION1";
  const cicsPlex = "PLEX01";
  const criteria = "program=D*";

  const dummySession = new Session({
    user: "fake",
    password: "fake",
    hostname: "fake",
    port: 1490,
  });

  let error: Error | CicsCmciRestError | undefined;
  let response: ICMCIApiResponse | undefined;
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
        cicsPlex: undefined,
      };
    });

    it("should throw error if no parms are defined", async () => {
      try {
        response = await getResource(dummySession, undefined as any);
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/(Cannot read).*undefined/);
    });

    it("should throw error if resource name is not defined", async () => {
      try {
        response = await getResource(dummySession, {
          regionName: "fake",
          name: undefined as any,
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error?.message).toContain("CICS resource name is required");
    });

    it("should throw error if resource name is missing", async () => {
      try {
        response = await getResource(dummySession, {
          regionName: "fake",
          name: "",
        });
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error?.message).toContain("Required parameter 'CICS Resource name' must not be blank");
    });
  });

  describe("success scenarios", () => {
    const getExpectStringMock = jest.spyOn(RestClient, "getExpectString");

    beforeEach(() => {
      response = undefined;
      error = undefined;
      resourceParms = {
        regionName: region,
        name: resource,
        criteria: undefined,
        cicsPlex: undefined,
      };
      getExpectStringMock.mockClear();
      getExpectStringMock.mockResolvedValue(ok2RecordsXmlResponse);
    });

    it("should be able to get a resource without CICS Region name being defined", async () => {
      try {
        resourceParms.regionName = undefined;
        response = await getResource(dummySession, resourceParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/";

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource without CICS Region name being specified", async () => {
      try {
        resourceParms.regionName = "";
        response = await getResource(dummySession, resourceParms);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/";

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource without cicsPlex specified", async () => {
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      response = await getResource(dummySession, resourceParms);

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource without criteria specified", async () => {
      resourceParms.criteria = undefined;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      response = await getResource(dummySession, resourceParms);

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with cicsPlex specified and criteria not specified", async () => {
      resourceParms.cicsPlex = cicsPlex;
      resourceParms.criteria = undefined;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + cicsPlex + "/" + region;

      response = await getResource(dummySession, resourceParms);

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with criteria specified", async () => {
      resourceParms.cicsPlex = undefined;
      resourceParms.criteria = criteria;
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        resource +
        "/" +
        region +
        "?CRITERIA=(" +
        encodeURIComponent(resourceParms.criteria) +
        ")";
      response = await getResource(dummySession, resourceParms);

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with SUMMONLY specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        summonly: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?SUMMONLY`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with NODISCARD specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        nodiscard: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?NODISCARD`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should be able to get a resource with OVERRIDEWARNINGCOUNT specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        overrideWarningCount: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?OVERRIDEWARNINGCOUNT`;
      response = await getResource(dummySession, resourceParms);

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
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

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
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

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should error when failOnNoData is true and data is not returned", async () => {
      getExpectStringMock.mockClear();
      getExpectStringMock.mockResolvedValue(nodataXmlResponse);

      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/REGION1`;
      try {
        response = await getResource(dummySession, resourceParms, { failOnNoData: true });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(`${error}`).toContain("1027");
      expect(response).toBeUndefined();
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should not fail when failOnNoData is true and data is returned", async () => {
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/REGION1`;
      response = await getResource(dummySession, resourceParms, { failOnNoData: true });

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should not fail when failOnNoData is false and data is not returned", async () => {
      getExpectStringMock.mockClear();
      getExpectStringMock.mockResolvedValue(nodataXmlResponse);

      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/REGION1`;
      try {
        response = await getResource(dummySession, resourceParms, { failOnNoData: false });
      } catch (err) {
        error = err;
      }

      expect(error).toBeUndefined();
      expect(response).toBeDefined();
      expect(response).toEqual(nodataContent);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should provide a CicsCmciRestError when requestOptions.useCICSCmciRestError is true", async () => {
      getExpectStringMock.mockClear();
      getExpectStringMock.mockResolvedValue(nodataXmlResponse);

      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/REGION1`;
      try {
        response = await getResource(dummySession, resourceParms, { useCICSCmciRestError: true });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(response).toBeUndefined();
      expect(error).toBeInstanceOf(CicsCmciRestError);
      if (error instanceof CicsCmciRestError) {
        expect(error.RESPONSE_1).toEqual(1027);
        expect(error.RESPONSE_1_ALT).toEqual("NODATA");
      }
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should provide a ImperativeError when requestOptions.useCICSCmciRestError is false", async () => {
      getExpectStringMock.mockClear();
      getExpectStringMock.mockResolvedValue(nodataXmlResponse);

      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/REGION1`;
      try {
        response = await getResource(dummySession, resourceParms, { useCICSCmciRestError: false });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(response).toBeUndefined();
      expect(error).toBeInstanceOf(ImperativeError);
      expect(error?.message).toContain("Did not receive the expected response from CMCI REST API");
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should send headers", async () => {
      try {
        response = await getResource(dummySession, resourceParms, undefined, [{ "MY-HEADER": "MY-HEADER-VALUE" }]);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, [{ "MY-HEADER": "MY-HEADER-VALUE" }]);
    });

    it("should send no headers when empty array passed", async () => {
      try {
        response = await getResource(dummySession, resourceParms, undefined, []);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });

    it("should send no headers as default value when nothing passed", async () => {
      try {
        response = await getResource(dummySession, resourceParms, undefined);
      } catch (err) {
        error = err;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      expect(response).toEqual(okContent2Records);
      expect(getExpectStringMock).toHaveBeenCalledWith(dummySession, endPoint, []);
    });
  });
});
