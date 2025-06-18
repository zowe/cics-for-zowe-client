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
  newcopycnt: "0",
  eyu_cicsname: "MYREG",
  enablestatus: "ENABLED",
  progtype: "PROGRAM",
  library: "MYLIB",
  librarydsn: "MYLIBDSN",
};
const prog2: IProgram = {
  program: "PROG2",
  status: "DISABLED",
  newcopycnt: "2",
  eyu_cicsname: "MYREG",
  enablestatus: "ENABLED",
  progtype: "PROGRAM",
  library: "MYLIB",
  librarydsn: "MYLIBDSN",
};

const runGetCacheMock = jest.fn();

jest.mock("@zowe/cics-for-zowe-sdk", () => ({
  ...jest.requireActual("@zowe/cics-for-zowe-sdk"),
  getCache: runGetCacheMock,
}));

const runGetResourceMock = jest.fn();

jest.mock("../../../src/utils/resourceUtils", () => ({
  runGetResource: runGetResourceMock,
}));

import { IProgram, IResource, ProgramMeta } from "../../../src/doc";
import { CICSSession, Resource } from "../../../src/resources";
import { ResourceContainer } from "../../../src/resources/ResourceContainer";
import { CICSProfileMock } from "../../__utils__/globalMocks";

describe("Resource Container", () => {
  let container: ResourceContainer<IResource>;
  let cicsSessionMock: CICSSession;

  beforeEach(() => {
    container = new ResourceContainer(ProgramMeta);
    cicsSessionMock = new CICSSession({ ...CICSProfileMock, hostname: "MY.HOST" });

    jest.clearAllMocks();

    runGetCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicsprogram: [prog1, prog2],
        },
      },
    });

    runGetResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1024",
          cachetoken: "MYCACHETOKEN",
        },
      },
    });
  });

  it("creates resource container", () => {
    expect(container).toBeDefined();
    expect(container.getMeta()).toBe(ProgramMeta);
  });

  it("should default values on instantiation", () => {
    expect(container.isFilterApplied()).toBeFalsy();
    expect(container.getResources()).toEqual([]);
    expect(container.getResource()).toBeUndefined();
    expect(container.getFetchedAll()).toBeFalsy();
  });

  it("should set criteria", async () => {
    // @ts-ignore - private property
    expect(container.criteria).toEqual(await ProgramMeta.getDefaultCriteria());
    container.setCriteria(["a", "b"]);
    // @ts-ignore - private property
    expect(container.criteria).toEqual("PROGRAM=a OR PROGRAM=b");
  });

  it("should set numtoFetch", async () => {
    // @ts-ignore - private property
    expect(container.numberToFetch).toEqual(100);
    container.setNumberToFetch(12);
    // @ts-ignore - private property
    expect(container.numberToFetch).toEqual(12);
    await container.resetNumberToFetch();
    // @ts-ignore - private property
    expect(container.numberToFetch).toEqual(100);
  });

  it("should load resources with no plexname and no cache token", async () => {
    // @ts-ignore - private property
    expect(container.cacheToken).toBeNull();

    const [resources, moreToFetch] = await container.loadResources(cicsSessionMock, "MYREG", undefined);
    expect(moreToFetch).toBeFalsy();
    expect(resources).toEqual([new Resource<IProgram>(prog1), new Resource<IProgram>(prog2)]);

    expect(runGetResourceMock).toHaveBeenCalledWith({
      session: cicsSessionMock,
      resourceName: "CICSProgram",
      cicsPlex: undefined,
      regionName: "MYREG",
      params: {
        criteria: await ProgramMeta.getDefaultCriteria(),
        queryParams: {
          summonly: true,
          nodiscard: true,
          overrideWarningCount: true,
        },
      },
    });
    expect(runGetCacheMock).toHaveBeenCalledWith(
      cicsSessionMock,
      {
        cacheToken: "MYCACHETOKEN",
        startIndex: 1,
        count: 100,
        nodiscard: true,
        summonly: false,
      },
      {
        failOnNoData: false,
        useCICSCmciRestError: true,
      }
    );
  });

  it("should load resources with cache token", async () => {
    // @ts-ignore - private property
    container.cacheToken = "NEWTOKEN";

    const [resources, moreToFetch] = await container.loadResources(cicsSessionMock, "MYREG", undefined);
    expect(moreToFetch).toBeFalsy();
    expect(resources).toEqual([new Resource<IProgram>(prog1), new Resource<IProgram>(prog2)]);

    expect(runGetResourceMock).toHaveBeenCalledTimes(0);
    expect(runGetCacheMock).toHaveBeenCalledWith(
      cicsSessionMock,
      {
        cacheToken: "NEWTOKEN",
        startIndex: 1,
        count: 100,
        nodiscard: true,
        summonly: false,
      },
      {
        failOnNoData: false,
        useCICSCmciRestError: true,
      }
    );
  });

  it("should load resources and get NODATA", async () => {
    runGetResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1027",
        },
      },
    });

    const [resources, moreToFetch] = await container.loadResources(cicsSessionMock, "MYREG", undefined);
    expect(moreToFetch).toBeFalsy();
    expect(resources).toEqual([]);
    // @ts-ignore - private property
    expect(container.cacheToken).toBeNull();
    // @ts-ignore - private property
    expect(container.fetchedAll).toBeTruthy();

    expect(runGetResourceMock).toHaveBeenCalledWith({
      session: cicsSessionMock,
      resourceName: "CICSProgram",
      cicsPlex: undefined,
      regionName: "MYREG",
      params: {
        criteria: await ProgramMeta.getDefaultCriteria(),
        queryParams: {
          summonly: true,
          nodiscard: true,
          overrideWarningCount: true,
        },
      },
    });
    expect(runGetCacheMock).toHaveBeenCalledTimes(0);
  });
});
