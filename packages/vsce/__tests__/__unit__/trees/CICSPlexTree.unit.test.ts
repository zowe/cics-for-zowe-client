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

import { CICSRegionsContainer, CICSTree } from "../../../src/trees";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import * as iconUtils from "../../../src/utils/iconUtils";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { getResourceMock, profile } from "../../__mocks__";
import { workspace } from "vscode";

jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);
jest.spyOn(PersistentStorage, "getLoadedCICSProfiles").mockReturnValue([]);
const iconMock = jest.spyOn(iconUtils, "getIconFilePathFromName");

describe("Test suite for CICSLocalFileTree", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;
  let plexTree: CICSPlexTree;
  let regionTree: CICSRegionTree;

  beforeEach(() => {
    cicsTree = new CICSTree();
    sessionTree = new CICSSessionTree(profile, cicsTree);
    expect(iconMock).toHaveBeenCalledWith("profile-unverified");
    plexTree = new CICSPlexTree("MYPLEX", profile, sessionTree);
    expect(iconMock).toHaveBeenCalledWith("cics-plex");
    regionTree = new CICSRegionTree("MYREG", {}, sessionTree, plexTree, plexTree);
  });

  describe("Test suite for addRegion()", () => {
    it("Should add CICSRegionTree into localFile", () => {
      plexTree.children.push(regionTree);
      expect(plexTree.children.length).toEqual(12);
    });
  });

  describe("Test suite for loadContents()", () => {
    it("Should load Region and add it into region", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultSummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsregion: { applid: "MYREG", jobid: "JOB12345" } },
        },
      });

      await plexTree.loadOnlyRegion();
      expect(getResourceMock).toHaveBeenCalled();
      expect(plexTree.activeFilter).toBeUndefined();
      expect(plexTree.children.length).toEqual(1);
    });
  });

  describe("Test suite for getResourceFilter", () => {
    it("Should return resource filter", () => {
      plexTree.resourceFilters = {
        region: "Region1",
      };

      expect(plexTree.getResourceFilter("region")).toEqual("Region1");
    });
  });

  describe("Test suite for getPlexName", () => {
    it("Should return plex name", () => {
      expect(plexTree.getPlexName()).toEqual("MYPLEX");
    });
  });

  describe("Test suite for getChildren", () => {
    it("Should return children object", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          records: {
            cicsregion: { applid: "MYREG" },
          },
        },
      });
      expect((await plexTree.getChildren())?.length).toEqual(11);
    });
  });

  describe("Test suite for clearChildren", () => {
    it("Should clear all elements from children object", () => {
      plexTree.children.push(regionTree);

      plexTree.clearChildren();
      expect(plexTree.children.length).toEqual(0);
    });
  });

  describe("Test suite for setLabel", () => {
    it("Should set label name", () => {
      plexTree.setLabel("label");

      expect(plexTree.label).toBe("label");
    });
  });

  describe("Test suite for getActiveFilter()", () => {
    it("Should return the active filter", () => {
      plexTree.activeFilter = "Active";

      expect(plexTree.getActiveFilter()).toBe("Active");
    });
  });

  describe("Test suite for addNewCombinedTrees()", () => {
    it("Should push all new combined trees instance into children array", () => {
      expect(plexTree.children).toHaveLength(11);
    });
  });

  describe("Test suite for getGroupName()", () => {
    it("Should return group name when not set", () => {
      plexTree.getGroupName();

      expect(plexTree.getGroupName()).toBeUndefined();
    });
    it("Should return group name when not set", () => {
      plexTree.getGroupName();
      plexTree = new CICSPlexTree("MYPLEX", profile, sessionTree, "MYGRP");

      expect(plexTree.getGroupName()).toEqual("MYGRP");
    });
  
    describe("Test suite for region filter persistence", () => {
      it("should save region filter to savedRegionFilter property", () => {
        plexTree.saveRegionFilter("TEST*");
        expect(plexTree.savedRegionFilter).toBe("TEST*");
      });

      it("should call parent saveRegionFilterForPlex when saving filter", () => {
        const saveFilterSpy = jest.spyOn(sessionTree, "saveRegionFilterForPlex");
        plexTree.saveRegionFilter("CICS*");
        expect(saveFilterSpy).toHaveBeenCalledWith("MYPLEX", "CICS*");
      });

      it("should save wildcard filter", () => {
        const saveFilterSpy = jest.spyOn(sessionTree, "saveRegionFilterForPlex");
        plexTree.saveRegionFilter("*");
        expect(plexTree.savedRegionFilter).toBe("*");
        expect(saveFilterSpy).toHaveBeenCalledWith("MYPLEX", "*");
      });

      it("should save comma-separated filter patterns", () => {
        plexTree.saveRegionFilter("CICS*,TEST*,PROD*");
        expect(plexTree.savedRegionFilter).toBe("CICS*,TEST*,PROD*");
      });

      it("should get saved region filter", () => {
        plexTree.savedRegionFilter = "SAVED*";
        expect(plexTree.savedRegionFilter).toBe("SAVED*");
      });

      it("should return undefined when no filter is saved", () => {
        plexTree.savedRegionFilter = undefined;
        expect(plexTree.savedRegionFilter).toBeUndefined();
      });

      it("should restore saved filter from session tree on construction", () => {
        jest.spyOn(sessionTree, "getRegionFilterForPlex").mockReturnValue("RESTORED*");
        const newPlexTree = new CICSPlexTree("TESTPLEX", profile, sessionTree);
        expect(newPlexTree.savedRegionFilter).toBe("RESTORED*");
      });

      it("should not set savedRegionFilter when session tree has no saved filter", () => {
        jest.spyOn(sessionTree, "getRegionFilterForPlex").mockReturnValue(undefined);
        const newPlexTree = new CICSPlexTree("TESTPLEX", profile, sessionTree);
        expect(newPlexTree.savedRegionFilter).toBeUndefined();
      });

      it("should pass saved filter to regions container on construction", () => {
        jest.spyOn(sessionTree, "getRegionFilterForPlex").mockReturnValue("INIT*");
        const newPlexTree = new CICSPlexTree("TESTPLEX", profile, sessionTree);
        const regionsContainer = newPlexTree.children.find((child) => child instanceof CICSRegionsContainer) as CICSRegionsContainer;
        expect(regionsContainer.activeFilter).toBe("INIT*");
      });
    });
  });

  describe("Test to check if children are sorted", () => {
    it("CICSPlexTree children are organised", async () => {
      expect(plexTree.children.length).toEqual(11);
      expect(plexTree.children[0]).toBeInstanceOf(CICSRegionsContainer);

      const actual = plexTree.children.slice(1).map((c) => `${c.label}`);
      const expected = plexTree.children
        .slice(1)
        .map((c) => `${c.label}`)
        .sort((a, b) => a.localeCompare(b));

      expect(actual).toEqual(expected);
    });
  });

  describe("Test suite for getChildren with refreshNode", () => {
    it("Should return children when refreshNode is true", async () => {
      plexTree.refreshNode = true;
      const children = await plexTree.getChildren();
      expect(plexTree.refreshNode).toBe(false);
      expect(children).toBe(plexTree.children);
    });

    it("Should expand regions container when no region name in profile", async () => {
      const profileWithoutRegion = {
        ...profile,
        profile: {
          ...profile.profile,
          regionName: undefined as string | undefined,
        },
      };
      const plexTreeNoRegion = new CICSPlexTree("MYPLEX", profileWithoutRegion, sessionTree);
      const children = await plexTreeNoRegion.getChildren();
      expect(plexTreeNoRegion.regionsContainer).toBeDefined();
      expect(plexTreeNoRegion.regionsContainer!.collapsibleState).toBe(2); // TreeItemCollapsibleState.Expanded
      expect(children).toBe(plexTreeNoRegion.children);
    });
  });

  describe("Test suite for addNewCombinedTrees with config disabled", () => {
    it("Should not add Transaction tree when config is disabled", () => {
      jest.spyOn(workspace, "getConfiguration").mockReturnValue({
        get: jest.fn((key: string) => {
          if (key === "Transaction") return false;
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        update: jest.fn(),
      } as ReturnType<typeof workspace.getConfiguration>);

      const plexTreeNoTransaction = new CICSPlexTree("MYPLEX2", profile, sessionTree);
      const transactionTree = plexTreeNoTransaction.children.find((child) => `${child.label}`.includes("Transaction"));
      expect(transactionTree).toBeUndefined();
    });

    it("Should not add LocalFile tree when config is disabled", () => {
      jest.spyOn(workspace, "getConfiguration").mockReturnValue({
        get: jest.fn((key: string) => {
          if (key === "LocalFile") return false;
          return true;
        }),
        has: jest.fn(),
        inspect: jest.fn(),
        update: jest.fn(),
      } as ReturnType<typeof workspace.getConfiguration>);

      const plexTreeNoLocalFile = new CICSPlexTree("MYPLEX3", profile, sessionTree);
      const localFileTree = plexTreeNoLocalFile.children.find((child) => `${child.label}`.includes("Files"));
      expect(localFileTree).toBeUndefined();
    });
  });

  describe("Test suite for getSession()", () => {
    it("Should return session from parent", () => {
      const session = plexTree.getSession();
      expect(session).toBeDefined();
      expect(session).toBe(sessionTree.getSession());
    });
  });

  describe("Test suite for getSessionNode()", () => {
    it("Should return session node (parent)", () => {
      const sessionNode = plexTree.getSessionNode();
      expect(sessionNode).toBe(sessionTree);
      expect(sessionNode).toBe(plexTree.getParent());
    });
  });

  describe("Test suite for getRegionNodeFromName()", () => {
    it("Should return undefined when no regions container", () => {
      plexTree.children = [];
      const regionNode = plexTree.getRegionNodeFromName("MYREG");
      expect(regionNode).toBeUndefined();
    });

    it("Should return undefined when regions container has no children", () => {
      const regionsContainer = plexTree.children.find((child) => child instanceof CICSRegionsContainer) as CICSRegionsContainer;
      regionsContainer.children = [];
      const regionNode = plexTree.getRegionNodeFromName("MYREG");
      expect(regionNode).toBeUndefined();
    });

    it("Should return region node when found", () => {
      const regionsContainer = plexTree.children.find((child) => child instanceof CICSRegionsContainer) as CICSRegionsContainer;
      const testRegion = new CICSRegionTree("TESTREG", { applid: "TESTREG", cicsstate: "ACTIVE" }, sessionTree, plexTree, plexTree);
      regionsContainer.children = [testRegion];
      const regionNode = plexTree.getRegionNodeFromName("TESTREG");
      expect(regionNode).toBe(testRegion);
      expect(regionNode?.getRegionName()).toBe("TESTREG");
    });

    it("Should return undefined when region name not found", () => {
      const regionsContainer = plexTree.children.find((child) => child instanceof CICSRegionsContainer) as CICSRegionsContainer;
      const testRegion = new CICSRegionTree("TESTREG", { applid: "TESTREG", cicsstate: "ACTIVE" }, sessionTree, plexTree, plexTree);
      regionsContainer.children = [testRegion];
      const regionNode = plexTree.getRegionNodeFromName("NONEXISTENT");
      expect(regionNode).toBeUndefined();
    });
  });
});
