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

import { CICSTree } from "../../../src/trees";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import * as iconUtils from "../../../src/utils/iconUtils";
import { profile } from "../../__mocks__";

const iconSpy = jest.spyOn(iconUtils, "getIconFilePathFromName");

describe("Test suite for CICSSessionTree", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;
  let plexTree: CICSPlexTree;
  let regionTree: CICSRegionTree;

  describe("Validation", () => {
    beforeEach(() => {
      cicsTree = new CICSTree();
      sessionTree = new CICSSessionTree(profile, cicsTree);
      sessionTree.isUnauthorized = true;
      expect(iconSpy).toHaveBeenCalledWith("profile-unverified");
    });

    describe("Test suite for addRegion", () => {
      it("should push CICSRegionTree object into children", () => {
        regionTree = new CICSRegionTree("MYREG", {}, sessionTree, undefined, sessionTree);
        sessionTree.addRegion(regionTree);
        expect(sessionTree.getChildren().length).toEqual(1);
      });
    });
    describe("Test suite for addPlex", () => {
      it("should push CICSPlexTree object into children", () => {
        plexTree = new CICSPlexTree("MYPLEX", profile, sessionTree);
        sessionTree.addPlex(plexTree);
        expect(sessionTree.getChildren().length).toEqual(1);
      });
    });
    describe("Test suite for getChildren", () => {
      it("should return an array of childrens", () => {
        expect(sessionTree.getChildren().length).toEqual(0);
      });
    });
    describe("Test suite for setUnauthorized", () => {
      it("should set isUnauthorized to true", () => {
        sessionTree.setUnauthorized();
        expect(sessionTree.isUnauthorized).toBeTruthy();
      });
    });
    describe("Test suite for setAuthorized", () => {
      it("should set isUnauthorized to false", () => {
        sessionTree.setAuthorized();
        expect(sessionTree.isUnauthorized).toBeFalsy();
      });
    });
    describe("Test suite for getIsUnauthorized", () => {
      it("should return the object of isUnauthorized", () => {
        expect(sessionTree.getIsUnauthorized()).toBeTruthy();
      });
    });
  });
});
