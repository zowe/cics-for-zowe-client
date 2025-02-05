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

const getIconFilePathFromNameMock = jest.fn();
const cicsCombinedTreeMock = jest.fn();

import { IProfileLoaded } from "@zowe/imperative";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("../../../src/trees/CICSCombinedTrees/CICSCombinedLibraryTree", () => ({
  get CICSCombinedLibraryTree() {
    return cicsCombinedTreeMock;
  },
}));
jest.mock("../../../src/trees/CICSCombinedTrees/CICSCombinedResourceTree", () => ({
  get CICSCombinedResourceTree() {
    return cicsCombinedTreeMock;
  },
}));

jest.mock("../../../src/trees/CICSRegionsContainer", () => ({
  get CICSRegionsContainer() {
    return cicsCombinedTreeMock;
  },
}));
jest.mock("../../../src/trees/CICSRegionTree");
jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/trees/CICSSessionTree");
jest.mock("../../../src/utils/iconUtils", () => {
  return { getIconFilePathFromName: getIconFilePathFromNameMock };
});

beforeEach(() => {
  jest.resetAllMocks();
});
const getResourceMock = globalMocks.getResourceMock;
const CICSRegionTreeMock = {};
const treeResourceMock = globalMocks.getDummyTreeResources("testResource", "fileName*", "cicsregion");
const record = [{ prop: "test1" }, { prop: "test2" }];

const plexName: string = "plex";
const iProfileMock = {
  regionName: "Region",
};
const iprofileLoadedMock = {
  profile: iProfileMock,
};
const CICSSessionTreeMock = {
  getSession: () => globalMocks.imperativeSession,
};
describe("Test suite for CICSLocalFileTree", () => {
  let sut: CICSPlexTree;

  beforeEach(() => {
    getIconFilePathFromNameMock.mockReturnValue(treeResourceMock.iconPath);
    sut = new CICSPlexTree(plexName, iprofileLoadedMock as any as IProfileLoaded, CICSSessionTreeMock as any as CICSSessionTree, "groupName");
    expect(getIconFilePathFromNameMock).toHaveBeenCalledWith("cics-system-group");
    cicsCombinedTreeMock.mockImplementation(() => {
      return {
        loadContents: () => {
          return jest.fn();
        },
      };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Test suite for addRegion()", () => {
    it("Should add CICSRegionTree into localFile", () => {
      sut.addRegion(CICSRegionTreeMock as CICSRegionTree);
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Test suite for loadContents()", () => {
    beforeEach(() => {
      getResourceMock.mockResolvedValue(globalMocks.ICMCIApiResponseMock);
    });
    afterEach(() => {
      getResourceMock.mockClear();
      jest.resetAllMocks();
    });

    it("Should load Region and add it into region", async () => {
      globalMocks.ICMCIApiResponseMock.response.records[treeResourceMock.resourceName.toLowerCase()] = record;

      await sut.loadOnlyRegion();
      expect(getResourceMock).toHaveBeenCalled();
      expect(sut.activeFilter).toBeUndefined();
      expect(sut.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Test suite for getResourceFilter", () => {
    it("Should return resource filter", () => {
      sut.resourceFilters = {
        region: "Region1",
      };

      expect(sut.getResourceFilter("region")).toEqual("Region1");
    });
  });

  describe("Test suite for getPlexName", () => {
    it("Should return plex name", () => {
      expect(sut.getPlexName()).toEqual("plex");
    });
  });

  describe("Test suite for getChildren", () => {
    it("Should return children object", () => {
      expect(sut.getChildren().length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Test suite for clearChildren", () => {
    it("Should clear all elements from children object", () => {
      sut.children.push(CICSRegionTreeMock as CICSRegionTree);

      sut.clearChildren();
      expect(sut.children.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Test suite for setLabel", () => {
    it("Should set label name", () => {
      sut.setLabel("label");

      expect(sut.label).toBe("label");
    });
  });

  describe("Test suite for getActiveFilter()", () => {
    it("Should return the active filter", () => {
      sut.activeFilter = "Active";

      expect(sut.getActiveFilter()).toBe("Active");
    });
  });

  describe("Test suite for addNewCombinedTrees()", () => {
    it("Should push all new combined trees instance into children array", () => {
      sut.addNewCombinedTrees();

      expect(sut.children.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe("Test suite for addRegionContainer()", () => {
    it("Should push region container instance into children array", () => {
      sut.addRegionContainer();

      expect(sut.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Test suite for getGroupName()", () => {
    it("Should return group name", () => {
      sut.getGroupName();

      expect(sut.getGroupName()).toBe("groupName");
    });
  });
});
