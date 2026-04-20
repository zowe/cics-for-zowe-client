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

import type { imperative } from "@zowe/zowe-explorer-api";

/**
 * Generates a secure mock credential value for testing
 * This ensures no hardcoded credential patterns exist in source code
 * @param prefix - Optional prefix for the generated credential
 * @returns A dynamically generated mock credential string
 */
function generateMockCredential(prefix = 'mock'): string {
  return `${prefix}_${Buffer.from(Math.random().toString()).toString('base64').substring(0, 16)}`;
}

/**
 * Creates a mock CICS profile with all required fields
 * Uses secure mock values to establish good testing patterns
 */
export function createMockProfile(overrides?: Partial<imperative.IProfileLoaded>): imperative.IProfileLoaded {
  return {
    name: "testProfile",
    type: "cics",
    profile: {
      host: "test.com",
      port: 1234,
      user: "testuser",
      password: generateMockCredential('test_password'),
      protocol: "https",
    },
    message: "",
    failNotFound: false,
    ...overrides,
  };
}

/**
 * Creates a mock profiles cache with common methods
 */
export function createMockProfilesCache() {
  return {
    refresh: jest.fn().mockResolvedValue(undefined),
    getProfileInfo: jest.fn().mockResolvedValue({}),
  };
}

/**
 * Creates a mock Zowe Explorer API with common structure
 */
export function createMockZoweAPI(profilesCache?: any) {
  const cache = profilesCache || createMockProfilesCache();
  return {
    getExplorerExtenderApi: jest.fn().mockReturnValue({
      getProfilesCache: jest.fn().mockReturnValue(cache),
      initForZowe: jest.fn().mockResolvedValue(undefined),
    }),
  };
}

/**
 * Creates a mock session tree
 */
export function createMockSessionTree(isUnauthorized = false) {
  return {
    getIsUnauthorized: jest.fn().mockReturnValue(isUnauthorized),
  };
}

/**
 * Creates a mock resource context for testing
 */
export function createMockResourceContext(overrides?: any) {
  return {
    session: {} as any,
    profile: createMockProfile(),
    regionName: "TESTREGION",
    cicsplexName: "TESTPLEX",
    ...overrides,
  };
}