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

const prog1: IProgram = {
  program: "PROG1",
  status: "ENABLED",
  eyu_cicsname: "MYREG",
  newcopycnt: "0",
  progtype: "PROGRAM",
  library: "MYLIB",
  librarydsn: "MYLIBDSN",
  usecount: "0",
  language: "COBOL",
  jvmserver: "EYUCMCIJ",
};
const prog2: IProgram = {
  program: "PROG2",
  status: "DISABLED",
  newcopycnt: "2",
  eyu_cicsname: "MYREG",
  progtype: "PROGRAM",
  library: "MYLIB",
  librarydsn: "MYLIBDSN",
  usecount: "0",
  language: "COBOL",
  jvmserver: "EYUCMCIJ",
};
const locFile1: ILocalFile = {
  browse: "",
  dsname: "A.B.C",
  enablestatus: "ENABLED",
  eyu_cicsname: "MYREG",
  file: "AS",
  keylength: "",
  openstatus: "OPEN",
  read: "",
  recordsize: "",
  vsamtype: "",
  update: "UPDATABLE",
  add: "ADDABLE",
  delete: "DELETABLE",
};

import { ILocalFile, IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { LocalFileMeta, ProgramMeta } from "../../../src/doc";
import { ResourceContainer } from "../../../src/resources/ResourceContainer";
import { getCacheMock, getResourceMock, profile } from "../../__mocks__";

describe("Resource Container", () => {
  let container: ResourceContainer;

  beforeEach(() => {
    container = new ResourceContainer([ProgramMeta], {
      profileName: profile.name!,
      regionName: "MYREG",
    });

    getCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicsprogram: [prog1, prog2],
        },
      },
    });

    getResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1024",
          cachetoken: "MYCACHETOKEN",
          recordcount: "2",
        },
      },
    });
  });

  it("creates resource container", () => {
    expect(container).toBeDefined();
  });

  it("should default values on instantiation", () => {
    expect(container.isCriteriaApplied()).toBeFalsy();
    expect(container.hasMore()).toBeFalsy();
  });

  it("should set criteria", async () => {
    expect(container.getCriteria(ProgramMeta)).toEqual(ProgramMeta.getDefaultCriteria());
    container.setCriteria(["a", "b"]);
    expect(container.getCriteria(ProgramMeta)).toEqual("PROGRAM=a OR PROGRAM=b");
  });

  it("should get region name", () => {
    expect(container.getRegionName()).toEqual("MYREG");
  });
  it("should get profile name", () => {
    expect(container.getProfileName()).toEqual("MYPROF");
  });
  it("should get plex name when not set", () => {
    expect(container.getPlexName()).toBeUndefined();
  });
  it("should get plex name when set", () => {
    container = new ResourceContainer([ProgramMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });
    expect(container.getPlexName()).toEqual("MYPLEX");
  });

  it("should ensure summaries", async () => {
    container = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });

    expect(container.isCriteriaApplied()).toBeFalsy();

    getCacheMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "2",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "1",
          },
          records: {
            cicsprogram: [locFile1],
          },
        },
      });

    getResourceMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "2",
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN2",
            recordcount: "1",
          },
        },
      });

    const res = await container.fetchNextPage();

    expect(res).toHaveLength(3);
  });

  it("should reset container and discard cache tokens", async () => {
    await container.fetchNextPage();
    expect(getResourceMock).toHaveBeenCalled();
    expect(getCacheMock).toHaveBeenCalled();
    const initialGetCacheCallCount = getCacheMock.mock.calls.length;
    await container.reset();

    // Verify cache token was discarded - getCacheMock should be called
    // and parameters including nodiscard: false and summonly: true
    const resetCalls = getCacheMock.mock.calls.slice(initialGetCacheCallCount);
    expect(resetCalls.length).toBeGreaterThan(0);

    // Check that at least one call has nodiscard: false and summonly: true
    const discardCall = resetCalls.find((call) => {
      const params = call[1];
      return params && params.nodiscard === false && params.summonly === true;
    });
    expect(discardCall).toBeDefined();
    expect(container.hasMore()).toBeFalsy();
    getCacheMock.mockClear();
    getResourceMock.mockClear();

    await container.fetchNextPage();
    // Should call getResource again to get new summaries
    expect(getResourceMock).toHaveBeenCalled();
  });
});
