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

jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: () => {
      return {
        loadNamedProfile: jest.fn().mockReturnValue({
          failNotFound: false,
          message: "",
          type: "cics",
          name: "MYPROF",
          profile: CICSProfileMock,
        }),
      };
    },
  },
}));

import type { Extension } from "vscode";
import * as vscode from "vscode";

jest.spyOn(vscode.extensions, "getExtension").mockReturnValue({
  packageJSON: {
    version: "1.2.3",
  },
} as Extension<any>);

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
  ...jest.requireActual("../../../src/utils/resourceUtils"),
  runGetResource: runGetResourceMock,
}));

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { IProgram, IResource, ProgramMeta } from "../../../src/doc";
import { Resource } from "../../../src/resources";
import { ResourceContainer } from "../../../src/resources/ResourceContainer";
import { CICSProfileMock } from "../../__utils__/globalMocks";

const prof = { ...CICSProfileMock, host: "hostname" };
const profileMock = { failNotFound: false, message: "", type: "cics", name: "MYPROF", profile: prof };

describe("Resource Container", () => {
  let container: ResourceContainer<IResource>;

  beforeEach(() => {
    container = new ResourceContainer(ProgramMeta);

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
    expect(container.numberToFetch).toEqual(250);
    container.setNumberToFetch(12);
    // @ts-ignore - private property
    expect(container.numberToFetch).toEqual(12);
    await container.resetNumberToFetch();
    // @ts-ignore - private property
    expect(container.numberToFetch).toEqual(250);
  });

  it("should load resources with no plexname and no cache token", async () => {
    // @ts-ignore - private property
    expect(container.cacheToken).toBeNull();

    const [resources, moreToFetch] = await container.loadResources(profileMock, "MYREG", undefined);
    expect(moreToFetch).toBeFalsy();
    expect(resources).toEqual([new Resource<IProgram>(prog1), new Resource<IProgram>(prog2)]);

    expect(runGetResourceMock).toHaveBeenCalledWith({
      profileName: "MYPROF",
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
    expect(runGetCacheMock).toHaveBeenCalledTimes(2);
  });

  it("should load resources with cache token", async () => {
    // @ts-ignore - private property
    container.cacheToken = "NEWTOKEN";

    const [resources, moreToFetch] = await container.loadResources(profileMock, "MYREG", undefined);
    expect(moreToFetch).toBeFalsy();
    expect(resources).toEqual([new Resource<IProgram>(prog1), new Resource<IProgram>(prog2)]);

    expect(runGetResourceMock).toHaveBeenCalledTimes(0);
    expect(runGetCacheMock).toHaveBeenCalledTimes(2);
  });

  it("should load resources and get NODATA", async () => {
    runGetResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1027",
        },
      },
    });

    const [resources, moreToFetch] = await container.loadResources(profileMock, "MYREG", undefined);
    expect(moreToFetch).toBeFalsy();
    expect(resources).toEqual([]);
    // @ts-ignore - private property
    expect(container.cacheToken).toBeNull();
    // @ts-ignore - private property
    expect(container.fetchedAll).toBeTruthy();

    expect(runGetResourceMock).toHaveBeenCalledWith({
      profileName: "MYPROF",
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
