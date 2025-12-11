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

import { CICSTree } from "../../../src/trees/CICSTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { ProfileManagement } from "../../../src/utils/profileManagement";
import { loadNamedProfileMock } from "../../__mocks__";

const removeLoadedCICSProfileSpy = jest.spyOn(PersistentStorage, "removeLoadedCICSProfile");
const getProfilesCacheMock = jest.spyOn(ProfileManagement, "getProfilesCache");

describe("Test suite for CICSTree", () => {
  let sut: CICSTree;

  beforeEach(() => {
    sut = new CICSTree();
  });

  it("Should have children", () => {
    expect(sut.loadedProfiles).toBeDefined();
    expect(sut.loadedProfiles).toHaveLength(1);
  });

  it("Should getLoadedProfiles", () => {
    const loadedProfs = sut.getLoadedProfiles();
    expect(loadedProfs).toBeDefined();
    expect(loadedProfs).toHaveLength(1);
  });

  it("Should clear profiles", () => {
    const loadedProfs = sut.getLoadedProfiles();
    expect(loadedProfs).toBeDefined();
    expect(loadedProfs).toHaveLength(1);

    sut.clearLoadedProfiles();
    expect(sut.loadedProfiles).toBeDefined();
    expect(sut.loadedProfiles).toHaveLength(0);
  });

  it("Should return the children", () => {
    expect(sut.getChildren()).toHaveLength(1);
  });

  it("Should remove loaded cics profile when throws profile not found error", async () => {
    loadNamedProfileMock.mockImplementationOnce(() => {
      throw new Error("Could not find profile named: prof3");
    });
    await sut.loadStoredProfileNames();

    expect(getProfilesCacheMock).toHaveBeenCalled();
    expect(removeLoadedCICSProfileSpy).toHaveBeenCalledTimes(1);
  });
});
