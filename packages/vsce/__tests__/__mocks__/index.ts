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

export const createProfile = (name: string, type: string, host: string, user?: string) => {
  return {
    name: name,
    message: "",
    type: type,
    failNotFound: false,
    profile: {
      user: user,
      host: host,
      port: 12345,
      cicsPlex: "MYPLEX",
      regionName: "MYREG",
    },
  } as imperative.IProfileLoaded;
};

export const profile = createProfile("MYPROF", "cics", "example.com", "myuser");
export const anotherProfile = createProfile("ANOTHERPROF", "cics", "another.com", "anotheruser");
export const profile2 = createProfile("MYPROF2", "cics", "example2.com", "myuser2");

export const getJesApiMock = jest.fn();
getJesApiMock.mockReturnValue(true);

export const getMvsApiMock = jest.fn();
getMvsApiMock.mockReturnValue(true);

export const getUssApiMock = jest.fn();
getUssApiMock.mockReturnValue(true);

export const vscodeRegisterCommandMock = jest.fn();
export const vscodeExecuteCommandMock = jest.fn();
export const showErrorMessageMock = jest.fn();
export const showInfoMessageMock = jest.fn();

export const fetchAllProfilesMock = jest.fn();
export const loadNamedProfileMock = jest.fn().mockImplementation((name?: string) => {
  const n = name ?? "";
  if (n.includes(anotherProfile.name ?? "")) return anotherProfile;
  if (n.includes(profile2.name ?? "")) return profile2;
  return profile;
});
export const getAllProfilesMock = jest.fn().mockReturnValue([]);

export const getResourceMock = jest.fn();
export const getCacheMock = jest.fn();

export const workspaceConfigurationGetMock = jest.fn().mockReturnValue([profile.name, profile2.name, anotherProfile.name]);
export const workspaceConfigurationUpdateMock = jest.fn();
