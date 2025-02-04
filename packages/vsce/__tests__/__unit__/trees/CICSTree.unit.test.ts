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
const profilesCacheRefreshMock = jest.fn();

import { CICSTree } from "../../../src/trees/CICSTree";

jest.mock("../../../src/utils/PersistentStorage", () => ({
  get PersistentStorage() {
    return jest.fn().mockImplementation(() => {
      return {
        getLoadedCICSProfile: profilesCacheRefreshMock,
      };
    });
  },
}));
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    profilesCacheRefresh: profilesCacheRefreshMock,
  },
}));

describe("Test suite for CICSTree", () => {
  let sut: CICSTree;
  beforeEach(() => {
    sut = new CICSTree();
  });
  it("Should run the test", () => {
    expect(true).toBeTruthy();
  });
});
