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
    },
  } as imperative.IProfileLoaded;
};

export const profile = createProfile("MYPROF", "cics", "example.com", "myuser");

export const getJesApiMock = jest.fn();
getJesApiMock.mockReturnValue(true);

export const getUssApiMock = jest.fn();
getUssApiMock.mockReturnValue(true);

export const vscodeRegisterCommandMock = jest.fn();
export const vscodeExecuteCommandMock = jest.fn();
export const showErrorMessageMock = jest.fn();
export const showInfoMessageMock = jest.fn();

export const fetchAllProfilesMock = jest.fn();
export const loadNamedProfileMock = jest.fn();
export const getAllProfilesMock = jest.fn().mockReturnValue([]);

export const getResourceMock = jest.fn();
export const getCacheMock = jest.fn();

export const workspaceConfigurationGetMock = jest.fn().mockReturnValue([profile.name]);
export const workspaceConfigurationUpdateMock = jest.fn();
