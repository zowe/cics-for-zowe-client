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
import { getResourceMock, profile } from "../../__mocks__";

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
      plexTree.addRegion(regionTree);
      expect(plexTree.children.length).toEqual(1);
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
    it("Should return children object", () => {
      expect(plexTree.getChildren().length).toEqual(0);
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
      plexTree.addNewCombinedTrees();
      expect(plexTree.children).toHaveLength(10);
    });
  });

  describe("Test suite for addRegionContainer()", () => {
    it("Should push region container instance into children array", () => {
      plexTree.addRegionContainer();

      expect(plexTree.children.length).toBeGreaterThanOrEqual(1);
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
  });

  describe("Test to check if children are sorted", () => {
    it("CICSPlexTree children are organised", async () => {
      plexTree.addRegionContainer();
      plexTree.addNewCombinedTrees();

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
});
