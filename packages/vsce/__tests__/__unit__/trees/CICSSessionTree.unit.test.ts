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

import { CICSTree } from "../../../src/trees";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/utils/iconUtils", () => {
  return { getIconFilePathFromName: getIconFilePathFromNameMock };
});
const cicstreeMock = jest.fn();
const treeResourceMock = globalMocks.getDummyTreeResources("cicsmanagedregion", "fileName*");
const profile = {
  profile: { user: "user", password: "pwd", hostname: "hostname", protocol: "https", type: "basic", rejectUnauthorized: false, port: 8080 },
};
describe("Test suite for CICSSessionTree", () => {
  let sut: CICSSessionTree;

  describe("Validation", () => {
    beforeEach(() => {
      getIconFilePathFromNameMock.mockReturnValue(treeResourceMock.iconPath);

      sut = new CICSSessionTree(profile, { _onDidChangeTreeData: { fire: () => jest.fn() } } as unknown as CICSTree);
      sut.isUnauthorized = true;
      expect(getIconFilePathFromNameMock).toHaveBeenCalledWith("profile-unverified");
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    describe("Test suite for addRegion", () => {
      it("should push CICSRegionTree object into children", () => {
        sut.addRegion(cicstreeMock as any as CICSRegionTree);
        expect(sut.getChildren().length).toBeGreaterThanOrEqual(1);
      });
    });
    describe("Test suite for addPlex", () => {
      it("should push CICSPlexTree object into children", () => {
        sut.addPlex(cicstreeMock as any as CICSPlexTree);
        expect(sut.getChildren().length).toBeGreaterThanOrEqual(1);
      });
    });
    describe("Test suite for getChildren", () => {
      it("should return an array of childrens", () => {
        expect(sut.getChildren().length).toBeGreaterThanOrEqual(0);
      });
    });
    describe("Test suite for setUnauthorized", () => {
      it("should set isUnauthorized to true", () => {
        sut.setUnauthorized();
        expect(sut.isUnauthorized).toBeTruthy();
      });
    });
    describe("Test suite for setAuthorized", () => {
      it("should set isUnauthorized to false", () => {
        sut.setAuthorized();
        expect(sut.isUnauthorized).toBeFalsy();
      });
    });
    describe("Test suite for getIsUnauthorized", () => {
      it("should return the object of isUnauthorized", () => {
        expect(sut.getIsUnauthorized()).toBeTruthy();
      });
    });
  });
});
