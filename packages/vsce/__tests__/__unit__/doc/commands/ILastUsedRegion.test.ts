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

import type { ILastUsedRegion } from "../../../../src/doc/commands/ILastUsedRegion";

describe("ILastUsedRegion", () => {
  it("should define the interface structure with all properties", () => {
    const mockLastUsedRegion: ILastUsedRegion = {
      regionName: "REGION1",
      cicsPlexName: "PLEX1",
      profileName: "testProfile",
    };

    expect(mockLastUsedRegion.regionName).toBe("REGION1");
    expect(mockLastUsedRegion.cicsPlexName).toBe("PLEX1");
    expect(mockLastUsedRegion.profileName).toBe("testProfile");
  });

  it("should allow null values", () => {
    const mockLastUsedRegion: ILastUsedRegion = {
      regionName: null,
      cicsPlexName: null,
      profileName: null,
    };

    expect(mockLastUsedRegion.regionName).toBeNull();
    expect(mockLastUsedRegion.cicsPlexName).toBeNull();
    expect(mockLastUsedRegion.profileName).toBeNull();
  });

  it("should work with mixed null and string values", () => {
    const mockLastUsedRegion: ILastUsedRegion = {
      regionName: "REGION1",
      cicsPlexName: null,
      profileName: "testProfile",
    };

    expect(mockLastUsedRegion.regionName).toBe("REGION1");
    expect(mockLastUsedRegion.cicsPlexName).toBeNull();
    expect(mockLastUsedRegion.profileName).toBe("testProfile");
  });
});


