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
  describe("Interface Structure", () => {
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
  });

  describe("Null Value Handling", () => {
    it("should allow all null values", () => {
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

  describe("Object Operations", () => {
    it("should be serializable to JSON", () => {
      const mockLastUsedRegion: ILastUsedRegion = {
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
        profileName: "testProfile",
      };

      const json = JSON.stringify(mockLastUsedRegion);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(mockLastUsedRegion);
    });

    it("should support partial updates", () => {
      const mockLastUsedRegion: ILastUsedRegion = {
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
        profileName: "testProfile",
      };

      const updated: ILastUsedRegion = {
        ...mockLastUsedRegion,
        regionName: "REGION2",
      };

      expect(updated.regionName).toBe("REGION2");
      expect(updated.cicsPlexName).toBe("PLEX1");
      expect(updated.profileName).toBe("testProfile");
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should represent a standalone CICS region (no plex)", () => {
      const standaloneRegion: ILastUsedRegion = {
        regionName: "CICSTS01",
        cicsPlexName: null,
        profileName: "myProfile",
      };

      expect(standaloneRegion.regionName).toBe("CICSTS01");
      expect(standaloneRegion.cicsPlexName).toBeNull();
      expect(standaloneRegion.profileName).toBe("myProfile");
    });

    it("should represent a CICS region in a CICSPlex", () => {
      const plexRegion: ILastUsedRegion = {
        regionName: "CICSTS01",
        cicsPlexName: "PLEXSM01",
        profileName: "myProfile",
      };

      expect(plexRegion.regionName).toBe("CICSTS01");
      expect(plexRegion.cicsPlexName).toBe("PLEXSM01");
      expect(plexRegion.profileName).toBe("myProfile");
    });
  });
});


