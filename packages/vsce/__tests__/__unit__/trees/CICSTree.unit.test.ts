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

import { imperative } from "@zowe/zowe-explorer-api";
import { CICSProfileMock } from "../../__utils__/globalMocks";

const profilesCacheRefreshMock = jest.fn();
profilesCacheRefreshMock.mockReturnValue(["prof1", "prof2"]);
const getProfilesCacheMock = jest.fn();
getProfilesCacheMock.mockReturnValue({
  loadNamedProfile: (name: string, type?: string): imperative.IProfileLoaded => {
    return {
      failNotFound: false,
      message: "",
      type: "cics",
      name: name,
      profile: CICSProfileMock,
    };
  },
});

import { CICSTree } from "../../../src/trees/CICSTree";

jest.mock("../../../src/utils/CICSLogger");

import PersistentStorage from "../../../src/utils/PersistentStorage";
const profilesCacheRefreshSpy = jest.spyOn(PersistentStorage, "getLoadedCICSProfiles");
profilesCacheRefreshSpy.mockReturnValue(["prof1", "prof2"]);

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    profilesCacheRefresh: profilesCacheRefreshMock,
    getProfilesCache: getProfilesCacheMock,
  },
}));

describe("Test suite for CICSTree", () => {
  let sut: CICSTree;

  beforeEach(() => {
    sut = new CICSTree();
  });

  it("Should have children", () => {
    expect(sut.loadedProfiles).toBeDefined();
    expect(sut.loadedProfiles).toHaveLength(2);
  });

  it("Should getLoadedProfiles", () => {
    const loadedProfs = sut.getLoadedProfiles();
    expect(loadedProfs).toBeDefined();
    expect(loadedProfs).toHaveLength(2);
  });

  it("Should clear profiles", () => {
    const loadedProfs = sut.getLoadedProfiles();
    expect(loadedProfs).toBeDefined();
    expect(loadedProfs).toHaveLength(2);

    sut.clearLoadedProfiles();
    expect(sut.loadedProfiles).toBeDefined();
    expect(sut.loadedProfiles).toHaveLength(0);
  });

  it("Should return the children", () => {
    expect(sut.getChildren()).toHaveLength(2);
  });
});
