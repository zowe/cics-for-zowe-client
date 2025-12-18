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

import { createProfile, fetchAllProfilesMock, getAllProfilesMock, getJesApiMock, getUssApiMock, loadNamedProfileMock, profile } from "../";

const zeApi: any = jest.createMockFromModule("@zowe/zowe-explorer-api");

zeApi.ZoweVsCodeExtension = {
  getZoweExplorerApi: jest.fn().mockReturnValue({
    getZoweExplorerApi: jest.fn(),
    getExplorerExtenderApi: jest.fn().mockReturnValue({
      getProfilesCache: jest.fn().mockReturnValue({
        fetchBaseProfile: jest.fn().mockImplementation((name: string) => {
          if (name === "exception") {
            throw Error("Error");
          }
          const splitString = name.split(".");
          if (splitString.length > 1) {
            return createProfile(splitString[0], "base", "", "");
          }
          return undefined;
        }),

        fetchAllProfiles: fetchAllProfilesMock,
        refresh: jest.fn(),
        registerCustomProfilesType: jest.fn(),
        loadNamedProfile: loadNamedProfileMock.mockReturnValue(profile),
        getProfileInfo: jest.fn().mockReturnValue({
          getAllProfiles: getAllProfilesMock,
          getTeamConfig: jest.fn().mockReturnValue({
            exists: true,
          }),
        }),
      }),
      initForZowe: jest.fn(),
      reloadProfiles: jest.fn(),
    }),
    getJesApi: getJesApiMock,
    getUssApi: getUssApiMock,
  }),
};

zeApi.ZoweExplorerApiType = {
  Uss: "USS",
  Jes: "JES",
};

zeApi.imperative = {
  ...jest.requireActual("@zowe/imperative"),
};

zeApi.Gui = {
  ...zeApi.Gui,
  createQuickPick: () => ({
    items: [] as string[],
    placeholder: "",
    ignoreFocusOut: true,
    show: jest.fn(),
    hide: jest.fn(),
  }),
};

module.exports = zeApi;
