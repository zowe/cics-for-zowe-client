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

import type { ICICSRegionWithSession } from "../../../../src/doc/commands/ICICSRegionWithSession";
import type { ICommandParams } from "../../../../src/doc/commands/ICommandParams";
import type { ILastUsedRegion } from "../../../../src/doc/commands/ILastUsedRegion";

describe("Command Interfaces", () => {
  describe("ICICSRegionWithSession", () => {
    it("should define the interface structure", () => {
      const mockRegionWithSession: ICICSRegionWithSession = {
        profile: {
          name: "testProfile",
          type: "cics",
          profile: {},
          message: "",
          failNotFound: false,
        },
        cicsPlexName: "TESTPLEX",
        session: {} as any,
        regionName: "TESTREGION",
      };

      expect(mockRegionWithSession.profile.name).toBe("testProfile");
      expect(mockRegionWithSession.cicsPlexName).toBe("TESTPLEX");
      expect(mockRegionWithSession.regionName).toBe("TESTREGION");
    });

    it("should allow optional cicsPlexName", () => {
      const mockRegionWithSession: ICICSRegionWithSession = {
        profile: {
          name: "testProfile",
          type: "cics",
          profile: {},
          message: "",
          failNotFound: false,
        },
        session: {} as any,
        regionName: "TESTREGION",
      };

      expect(mockRegionWithSession.cicsPlexName).toBeUndefined();
    });
  });

  describe("ICommandParams", () => {
    it("should define the interface structure", () => {
      const mockCommandParams: ICommandParams = {
        name: "TESTPROG",
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
      };

      expect(mockCommandParams.name).toBe("TESTPROG");
      expect(mockCommandParams.regionName).toBe("TESTREGION");
      expect(mockCommandParams.cicsPlex).toBe("TESTPLEX");
    });
  });

  describe("ILastUsedRegion", () => {
    it("should define the interface structure with values", () => {
      const mockLastUsedRegion: ILastUsedRegion = {
        regionName: "TESTREGION",
        cicsPlexName: "TESTPLEX",
        profileName: "testProfile",
      };

      expect(mockLastUsedRegion.regionName).toBe("TESTREGION");
      expect(mockLastUsedRegion.cicsPlexName).toBe("TESTPLEX");
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
  });
});