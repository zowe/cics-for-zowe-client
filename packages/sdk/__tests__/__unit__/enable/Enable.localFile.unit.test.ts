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
import { CicsCmciConstants, CicsCmciRestClient, enableLocalFile, ICMCIApiResponse, IBaseParms } from "../../../src";

describe("CMCI - enable localFile", () => {
  const localFile = "localFile";
  const region = "region";
  const content = "ThisIsATest" as unknown as ICMCIApiResponse;

  const enableParms: IBaseParms = {
    regionName: region,
    name: localFile,
  };

  const dummySession = new Session({
    user: "fake",
    password: "fake",
    hostname: "fake",
    port: 1490,
  });

  let error: any;
  let response: any;
  let endPoint: any;
  let requestBody: any;

  describe("validation", () => {
    beforeEach(() => {
      response = undefined;
      error = undefined;
      enableParms.regionName = region;
      enableParms.name = localFile;
    });

    it("should throw an error if no region name is specified", async () => {
      enableParms.regionName = undefined as any;
      try {
        response = await enableLocalFile(dummySession, enableParms);
      } catch (err) {
        error = err;
      }
      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS region name is required");
    });

    it("should throw an error if no localFile name is specified", async () => {
      enableParms.name = undefined as any;
      try {
        response = await enableLocalFile(dummySession, enableParms);
      } catch (err) {
        error = err;
      }
      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS LocalFile name is required");
    });
  });

  describe("success scenarios", () => {
    const enableSpy = jest.spyOn(CicsCmciRestClient, "putExpectParsedXml").mockResolvedValue(content);

    beforeEach(() => {
      response = undefined;
      error = undefined;
      enableSpy.mockClear();
      enableSpy.mockResolvedValue(content);
      enableParms.regionName = region;
      enableParms.name = localFile;
    });

    it("should be able to enable a localFile", async () => {
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        CicsCmciConstants.CICS_LOCAL_FILE +
        "/" +
        region +
        `?CRITERIA=(FILE=${enableParms.name})`;
      requestBody = {
        request: {
          action: {
            $: {
              name: "ENABLE",
            },
          },
        },
      };

      response = await enableLocalFile(dummySession, enableParms);
      expect(response).toContain(content);
      expect(enableSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });
  });
});
