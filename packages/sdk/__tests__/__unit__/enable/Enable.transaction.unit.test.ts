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
import { CicsCmciConstants, CicsCmciRestClient, enableTransaction, ICMCIApiResponse, IBaseParms } from "../../../src";

describe("CMCI - enable transaction", () => {
  const transaction = "transaction";
  const region = "region";
  const content = "ThisIsATest" as unknown as ICMCIApiResponse;

  const enableParms: IBaseParms = {
    regionName: region,
    name: transaction,
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
      enableParms.name = transaction;
    });

    it("should throw an error if no region name is specified", async () => {
      enableParms.regionName = undefined;
      try {
        response = await enableTransaction(dummySession, enableParms);
      } catch (err) {
        error = err;
      }
      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS region name is required");
    });

    it("should throw an error if no transaction name is specified", async () => {
      enableParms.name = undefined;
      try {
        response = await enableTransaction(dummySession, enableParms);
      } catch (err) {
        error = err;
      }
      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS Transaction name is required");
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
      enableParms.name = transaction;
    });

    it("should be able to enable a transaction", async () => {
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        CicsCmciConstants.CICS_LOCAL_TRANSACTION +
        "/" +
        region +
        `?CRITERIA=(TRANID=${enableParms.name})`;
      requestBody = {
        request: {
          action: {
            $: {
              name: "ENABLE",
            },
          },
        },
      };

      response = await enableTransaction(dummySession, enableParms);
      expect(response).toContain(content);
      expect(enableSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });
  });
});
