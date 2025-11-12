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

import { getInspectableResourceTypes } from "../../../src/commands/inspectResourceCommandUtils";

jest.mock("@zowe/cics-for-zowe-sdk");
jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: false,
  },
}));

describe("getInspectableResourceTypes", () => {
  test("Not all meta types are visible", () => {
    const result = getInspectableResourceTypes();
    expect(Array.from(result.keys()).includes("Program")).toBe(true);
    // Files are a special case where we want to combine local and remote into one option
    expect(Array.from(result.keys()).includes("Local File")).toBe(false);
    expect(Array.from(result.keys()).includes("File")).toBe(true);
    // We do not want to show LIBDSN in the list of inspectable resources because it doesn't currently work
    expect(Array.from(result.keys()).includes("Library Dataset")).toBe(false);
  });
});
