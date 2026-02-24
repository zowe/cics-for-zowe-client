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
import { CicsCmciConstants, CicsCmciRestClient, ICMCIApiResponse, IResourceParms, putResource } from "../../../src";
import { okContent2Records } from "../../__mocks__/CmciGetResponse";

describe("CMCI - Put resource", () => {
  const resource = "CICSProgram";
  const region = "REGION1";
  const cicsPlex = "PLEX01";
  const criteria = "program=TESTPROG";
  const parameter = "CSDGROUP(MYGROUP)";

  const dummySession = new Session({
    user: "fake",
    password: "fake",
    hostname: "fake",
    port: 1490,
  });

  let error: Error | undefined;
  let response: ICMCIApiResponse | undefined;
  let endPoint: string;
  let resourceParms: IResourceParms;
  const requestBody = { request: { action: { name: "CSDINSTALL" } } };

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
        // @ts-ignore - Not allowed to pass undefined here
        response = await putResource(dummySession, undefined, [], requestBody);
      } catch (err) {
        error = err as Error;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/(Cannot read).*undefined/);
    });

    it("should throw error if resource name is not defined", async () => {
      try {
        response = await putResource(
          dummySession,
          {
            regionName: "fake",
            // @ts-ignore - Not allowed to pass undefined here
            name: undefined,
          },
          [],
          requestBody
        );
      } catch (err) {
        error = err as Error;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error?.message).toContain("CICS resource name is required");
    });

    it("should throw error if resource name is missing", async () => {
      try {
        response = await putResource(
          dummySession,
          {
            regionName: "fake",
            name: "",
          },
          [],
          requestBody
        );
      } catch (err) {
        error = err as Error;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error?.message).toContain("Required parameter 'CICS Resource name' must not be blank");
    });
  });

  describe("success scenarios", () => {
    const putExpectParsedXmlMock = jest.spyOn(CicsCmciRestClient, "putExpectParsedXml");

    beforeEach(() => {
      response = undefined;
      error = undefined;
      resourceParms = {
        regionName: region,
        name: resource,
        criteria: undefined,
        cicsPlex: undefined,
      };
      putExpectParsedXmlMock.mockClear();
      putExpectParsedXmlMock.mockResolvedValue(okContent2Records);
    });

    it("should be able to put a resource without CICS Region name being defined", async () => {
      try {
        resourceParms.regionName = undefined;
        response = await putResource(dummySession, resourceParms, [], requestBody);
      } catch (err) {
        error = err as Error;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/";

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource without CICS Region name being specified", async () => {
      try {
        resourceParms.regionName = "";
        response = await putResource(dummySession, resourceParms, [], requestBody);
      } catch (err) {
        error = err as Error;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/";

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource without cicsPlex specified", async () => {
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      response = await putResource(dummySession, resourceParms, [], requestBody);

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource without criteria specified", async () => {
      resourceParms.criteria = undefined;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      response = await putResource(dummySession, resourceParms, [], requestBody);

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with cicsPlex specified and criteria not specified", async () => {
      resourceParms.cicsPlex = cicsPlex;
      resourceParms.criteria = undefined;
      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + cicsPlex + "/" + region;

      response = await putResource(dummySession, resourceParms, [], requestBody);

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with criteria specified", async () => {
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
      response = await putResource(dummySession, resourceParms, [], requestBody);

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with parameter specified", async () => {
      resourceParms.cicsPlex = cicsPlex;
      resourceParms.regionName = region;
      resourceParms.parameter = parameter;
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        resource +
        "/" +
        cicsPlex +
        "/" +
        region +
        "?PARAMETER=" +
        encodeURIComponent(resourceParms.parameter);
      response = await putResource(dummySession, resourceParms, [], requestBody);

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with query params specified", async () => {
      resourceParms.cicsPlex = "plex1";
      resourceParms.regionName = "reg1";
      resourceParms.queryParams = {
        summonly: true,
      };
      endPoint = `/${CicsCmciConstants.CICS_SYSTEM_MANAGEMENT}/${resource}/plex1/reg1?SUMMONLY`;
      response = await putResource(dummySession, resourceParms, [], requestBody);

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should send headers", async () => {
      try {
        response = await putResource(dummySession, resourceParms, [{ "MY-HEADER": "MY-HEADER-VALUE" }], requestBody);
      } catch (err) {
        error = err as Error;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [{ "MY-HEADER": "MY-HEADER-VALUE" }], requestBody, undefined);
    });

    it("should send no headers when empty array passed", async () => {
      try {
        response = await putResource(dummySession, resourceParms, [], requestBody);
      } catch (err) {
        error = err as Error;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should send request options when provided", async () => {
      const requestOptions = { useCICSCmciRestError: true };
      try {
        response = await putResource(dummySession, resourceParms, [], requestBody, requestOptions);
      } catch (err) {
        error = err as Error;
      }

      endPoint = "/" + CicsCmciConstants.CICS_SYSTEM_MANAGEMENT + "/" + resource + "/" + region;

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, requestOptions);
    });

    it("should log debug information with all parameters", async () => {
      resourceParms.cicsPlex = cicsPlex;
      resourceParms.criteria = criteria;
      resourceParms.parameter = parameter;

      response = await putResource(dummySession, resourceParms, [], requestBody);

      expect(response).toBeDefined();
      expect(putExpectParsedXmlMock).toHaveBeenCalled();
    });
  });
});

// Made with Bob
