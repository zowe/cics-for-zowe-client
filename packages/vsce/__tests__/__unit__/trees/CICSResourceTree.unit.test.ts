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

import * as CICSSDK from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { ProgramMeta } from "../../../src/doc";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSResourceTree } from "../../../src/trees/CICSResourceTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import * as filterUtils from "../../../src/utils/filterUtils";
import { window } from "vscode";

jest.mock("@zowe/cics-for-zowe-sdk");
const zoweSdk = require("@zowe/cics-for-zowe-sdk");

const mockResponse: CICSSDK.ICMCIApiResponse = {
  response: {
    resultsummary: {
      api_response1: "OK",
      api_response2: "",
      displayed_recordcount: '2',
      recordcount: "2",
    },
    records: {
      cicsprogram: [
        {
          program: "PROG1",
          status: "ENABLED",
          newcopycnt: "1",
        },
        {
          program: "PROG2",
          status: "DISABLED",
          newcopycnt: "2",
        },
      ]
    }
  }
};

const getResourceMock = jest.spyOn(zoweSdk, "getResource");
const filterMock = jest.spyOn(filterUtils, "getDefaultFilter");
filterMock.mockImplementationOnce(async (params) => new Promise((resolve, reject) => {
  resolve("NOT (PROGRAM=CEE* OR PROGRAM=DFH* OR PROGRAM=CJ* OR PROGRAM=EYU* OR PROGRAM=CSQ* OR PROGRAM=CEL* OR PROGRAM=IGZ*)");
}));

const profileMock = {
  name: "MYPROF",
  profile: {
    host: "abc.com",
    port: 12345
  }
};
const regionMock: CICSSDK.IRegion = {
  applid: "MYREG",
  cicsname: "MYREG",
  cicsstate: "ACTIVE",
  cicsstatus: "ACTIVE",
  eyu_cicsname: "MYREG"
};

const cicsSessionTreeMock = new CICSSessionTree(profileMock);
const cicsRegionTreeMock: CICSRegionTree = new CICSRegionTree(regionMock, cicsSessionTreeMock, undefined, cicsSessionTreeMock);

describe("CICSResourceTreeItem", () => {
  let resourceTree: CICSResourceTree<CICSSDK.IProgram>;
  let getDefaultProgramFilter: jest.SpyInstance;

  beforeEach(() => {
    resourceTree = new CICSResourceTree<CICSSDK.IProgram>(ProgramMeta, cicsRegionTreeMock);
    expect(resourceTree.children).toHaveLength(0);

    getDefaultProgramFilter = jest.spyOn(filterUtils, "getDefaultFilter").mockResolvedValueOnce("NOT (PROGRAM=CEE* OR PROGRAM=DFH* OR PROGRAM=CJ* OR PROGRAM=EYU* OR PROGRAM=CSQ* OR PROGRAM=CEL* OR PROGRAM=IGZ*)");
    getResourceMock.mockImplementation(async () => mockResponse);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should have the correct label", () => {
    expect(resourceTree.label).toEqual("Programs");
  });

  it("should be able to set filter", () => {
    resourceTree.setFilter("abc*");
    expect(resourceTree.activeFilter).toEqual("abc*");
  });

  it("should be able to get filter", () => {
    resourceTree.setFilter("abc*");
    expect(resourceTree.getFilter()).toEqual("abc*");
  });

  it("should be able to clear filter", () => {
    resourceTree.setFilter("abc*");
    expect(resourceTree.getFilter()).toEqual("abc*");
    resourceTree.clearFilter();
    expect(resourceTree.activeFilter).toBeUndefined();
  });

  it("should be able to get parent", () => {
    expect(resourceTree.getParent()).toEqual(cicsRegionTreeMock);
  });

  it("should be able to load contents", async () => {
    expect(resourceTree.children).toHaveLength(0);
    await resourceTree.loadContents();
    expect(filterMock).toHaveBeenCalled();
    expect(resourceTree.children).toHaveLength(2);
  });

  it("should be able to load contents with filter", async () => {
    expect(resourceTree.children).toHaveLength(0);
    resourceTree.setFilter("abc*");
    await resourceTree.loadContents();
    expect(filterMock).toHaveBeenCalled();
    expect(resourceTree.children).toHaveLength(2);
  });

  it("should be able to catch load contents resource limit error", async () => {
    expect(resourceTree.children).toHaveLength(0);

    const showErrorMessageMock = jest.spyOn(window, 'showErrorMessage');

    getResourceMock.mockImplementation(async () => {
      throw new imperative.ImperativeError({
        msg: "exceeded a resource limit",
      });
    });

    await resourceTree.loadContents();
    expect(filterMock).toHaveBeenCalled();
    expect(showErrorMessageMock).toHaveBeenCalled();
    expect(showErrorMessageMock).toHaveBeenCalledWith(`Resource Limit Exceeded - Set a filter to narrow search`);
    expect(resourceTree.children).toHaveLength(0);
  });

  it("should be able to catch load contents none found error", async () => {
    expect(resourceTree.children).toHaveLength(0);

    const showInfoMessageMock = jest.spyOn(window, 'showInformationMessage');

    getResourceMock.mockImplementation(async () => {
      throw new imperative.ImperativeError({
        msg: "Something else happened",
      });
    });

    await resourceTree.loadContents();
    expect(filterMock).toHaveBeenCalled();
    expect(showInfoMessageMock).toHaveBeenCalled();
    expect(showInfoMessageMock).toHaveBeenCalledWith(`No Programs found`);
    expect(resourceTree.children).toHaveLength(0);
  });

});
