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
import { CicsCmciConstants, CicsCmciRestClient, closeLocalFile, type ICMCIApiResponse, type ILocalFileParms } from "../../../src";

describe("CMCI - Close local file", () => {
  const localFile = "TESTFILE";
  const region = "region";
  const content = "ThisIsATest" as unknown as ICMCIApiResponse;

  const closeParms: ILocalFileParms = {
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
      closeParms.regionName = region;
      closeParms.name = localFile;
    });

    it("should throw an error if no region name is specified", async () => {
      (closeParms as any).regionName = undefined;
      try {
        response = await closeLocalFile(dummySession, closeParms);
      } catch (err) {
        error = err;
      }
      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS region name is required");
    });

    it("should throw an error if no local file name is specified", async () => {
      (closeParms as any).name = undefined;
      try {
        response = await closeLocalFile(dummySession, closeParms);
      } catch (err) {
        error = err;
      }
      expect(response).toBeUndefined();
      expect(error).toBeDefined();
      expect(error.message).toContain("CICS local file name is required");
    });
  });

  describe("success scenarios", () => {
    const closeSpy = jest.spyOn(CicsCmciRestClient, "putExpectParsedXml").mockResolvedValue(content);

    beforeEach(() => {
      response = undefined;
      error = undefined;
      closeSpy.mockClear();
      closeSpy.mockResolvedValue(content);
      closeParms.regionName = region;
      closeParms.name = localFile;
      closeParms.busy = undefined;
    });

    it("should be able to close a local file without BUSY parameter", async () => {
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        CicsCmciConstants.CICS_CMCI_LOCAL_FILE +
        "/" +
        region +
        `?CRITERIA=(FILE%3D${closeParms.name})`;
      requestBody = {
        request: {
          action: {
            $: {
              name: "CLOSE",
            },
          },
        },
      };

      response = await closeLocalFile(dummySession, closeParms);
      expect(response).toContain(content);
      expect(closeSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });

    it("should be able to close a local file with BUSY=WAIT parameter", async () => {
      closeParms.busy = "WAIT";
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        CicsCmciConstants.CICS_CMCI_LOCAL_FILE +
        "/" +
        region +
        `?CRITERIA=(FILE%3D${closeParms.name})`;
      requestBody = {
        request: {
          action: {
            $: {
              name: "CLOSE",
            },
            parameter: {
              $: {
                name: "BUSY",
                value: "WAIT",
              },
            },
          },
        },
      };

      response = await closeLocalFile(dummySession, closeParms);
      expect(response).toContain(content);
      expect(closeSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });

    it("should be able to close a local file with BUSY=NOWAIT parameter", async () => {
      closeParms.busy = "NOWAIT";
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        CicsCmciConstants.CICS_CMCI_LOCAL_FILE +
        "/" +
        region +
        `?CRITERIA=(FILE%3D${closeParms.name})`;
      requestBody = {
        request: {
          action: {
            $: {
              name: "CLOSE",
            },
            parameter: {
              $: {
                name: "BUSY",
                value: "NOWAIT",
              },
            },
          },
        },
      };

      response = await closeLocalFile(dummySession, closeParms);
      expect(response).toContain(content);
      expect(closeSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });

    it("should be able to close a local file with BUSY=FORCE parameter", async () => {
      closeParms.busy = "FORCE";
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        CicsCmciConstants.CICS_CMCI_LOCAL_FILE +
        "/" +
        region +
        `?CRITERIA=(FILE%3D${closeParms.name})`;
      requestBody = {
        request: {
          action: {
            $: {
              name: "CLOSE",
            },
            parameter: {
              $: {
                name: "BUSY",
                value: "FORCE",
              },
            },
          },
        },
      };

      response = await closeLocalFile(dummySession, closeParms);
      expect(response).toContain(content);
      expect(closeSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });

    it("should uppercase the BUSY parameter value", async () => {
      closeParms.busy = "wait";
      endPoint =
        "/" +
        CicsCmciConstants.CICS_SYSTEM_MANAGEMENT +
        "/" +
        CicsCmciConstants.CICS_CMCI_LOCAL_FILE +
        "/" +
        region +
        `?CRITERIA=(FILE%3D${closeParms.name})`;
      requestBody = {
        request: {
          action: {
            $: {
              name: "CLOSE",
            },
            parameter: {
              $: {
                name: "BUSY",
                value: "WAIT",
              },
            },
          },
        },
      };

      response = await closeLocalFile(dummySession, closeParms);
      expect(response).toContain(content);
      expect(closeSpy).toHaveBeenCalledWith(dummySession, endPoint, [], requestBody);
    });
  });
});

// Made with Bob
