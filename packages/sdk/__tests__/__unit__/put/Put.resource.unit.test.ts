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
import { CicsCmciRestClient, type ICMCIApiResponse, type IResourceParms, putResource } from "../../../src";

describe("CMCI - Put resource", () => {
  const resource = "CICSProgram";
  const region = "region";
  const cicsPlex = "plex";
  const content = "This\nis\r\na\ntest" as unknown as ICMCIApiResponse;

  const putParms: IResourceParms = {
    name: resource,
    regionName: region,
    cicsPlex: undefined,
  };

  const dummySession = new Session({
    user: "user",
    password: "password",
    hostname: "host",
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
        response = await putResource(dummySession, undefined as any, [], {});
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toMatch(/(Cannot read).*undefined/);
    });

    it("should throw error if resource name is not defined", async () => {
      try {
        response = await putResource(
          dummySession,
          {
            name: undefined as any,
            regionName: "fake",
          },
          [],
          {}
        );
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS resource name is required");
    });

    it("should throw error if resource name is missing", async () => {
      try {
        response = await putResource(
          dummySession,
          {
            name: "",
            regionName: "fake",
          },
          [],
          {}
        );
      } catch (err) {
        error = err;
      }

      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("Required parameter 'CICS Resource name' must not be blank");
    });
  });

  describe("success scenarios", () => {
    const requestBody: any = {
      request: {
        update: {
          attributes: {
            $: {
              status: "ENABLED",
            },
          },
        },
      },
    };

    const putSpy = jest.spyOn(CicsCmciRestClient, "putExpectParsedXml").mockResolvedValue(content);

    beforeEach(() => {
      response = undefined;
      error = undefined;
      putSpy.mockClear();
      putSpy.mockResolvedValue(content);
    });

    it("should be able to put a resource without cicsPlex specified", async () => {
      putParms.regionName = region;
      endPoint = "/CICSSystemManagement/" + resource + "/" + region;

      response = await putResource(dummySession, putParms, [], requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource without regionName", async () => {
      putParms.regionName = undefined;
      putParms.cicsPlex = undefined;
      endPoint = "/CICSSystemManagement/" + resource + "/";

      response = await putResource(dummySession, putParms, [], requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with cicsPlex specified but empty string", async () => {
      putParms.cicsPlex = "";
      putParms.regionName = undefined;
      endPoint = "/CICSSystemManagement/" + resource + "//";

      response = await putResource(dummySession, putParms, [], requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with cicsPlex specified", async () => {
      putParms.cicsPlex = cicsPlex;
      putParms.regionName = undefined;
      endPoint = "/CICSSystemManagement/" + resource + "/" + cicsPlex + "/";

      response = await putResource(dummySession, putParms, [], requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with criteria", async () => {
      putParms.cicsPlex = cicsPlex;
      putParms.regionName = undefined;
      putParms.criteria = "PROGRAM=TEST*";
      endPoint = "/CICSSystemManagement/" + resource + "/" + cicsPlex + "/?CRITERIA=(PROGRAM%3DTEST*)";

      response = await putResource(dummySession, putParms, [], requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with parameter", async () => {
      putParms.cicsPlex = cicsPlex;
      putParms.regionName = undefined;
      putParms.criteria = undefined;
      putParms.parameter = "CSDGROUP(GRP1)";
      endPoint = "/CICSSystemManagement/" + resource + "/" + cicsPlex + "/?PARAMETER=CSDGROUP(GRP1)";

      response = await putResource(dummySession, putParms, [], requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });

    it("should be able to put a resource with custom headers", async () => {
      putParms.cicsPlex = cicsPlex;
      putParms.regionName = region;
      putParms.criteria = undefined;
      putParms.parameter = undefined;
      const customHeaders = [{ "X-Custom-Header": "value" }];
      endPoint = "/CICSSystemManagement/" + resource + "/" + cicsPlex + "/" + region;

      response = await putResource(dummySession, putParms, customHeaders, requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, customHeaders, requestBody, undefined);
    });

    it("should be able to put a resource with request options", async () => {
      putParms.cicsPlex = cicsPlex;
      putParms.regionName = undefined;
      const requestOptions = { failOnNoData: false };
      endPoint = "/CICSSystemManagement/" + resource + "/" + cicsPlex + "/";

      response = await putResource(dummySession, putParms, [], requestBody, requestOptions);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, requestOptions);
    });

    it("should be able to put a resource with queryParams", async () => {
      putParms.cicsPlex = cicsPlex;
      putParms.regionName = undefined;
      putParms.criteria = undefined;
      putParms.parameter = undefined;
      putParms.queryParams = { nodiscard: true };
      endPoint = "/CICSSystemManagement/" + resource + "/" + cicsPlex + "/?NODISCARD";

      response = await putResource(dummySession, putParms, [], requestBody);

      expect(response).toContain(content);
      expect(putSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody, undefined);
    });
  });
});