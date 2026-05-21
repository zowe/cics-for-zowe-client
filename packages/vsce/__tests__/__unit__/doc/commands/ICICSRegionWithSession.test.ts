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
import type { IProfileLoaded } from "@zowe/imperative";
import type { CICSSession } from "@zowe/cics-for-zowe-sdk";

describe("ICICSRegionWithSession", () => {
  it("should define the interface structure with all required properties", () => {
    const mockRegionWithSession: ICICSRegionWithSession = {
      profile: {
        name: "testProfile",
        profile: {},
        type: "cics",
      } as IProfileLoaded,
      cicsPlexName: "PLEX1",
      session: {} as CICSSession,
      regionName: "REGION1",
    };

    expect(mockRegionWithSession.profile).toBeDefined();
    expect(mockRegionWithSession.cicsPlexName).toBe("PLEX1");
    expect(mockRegionWithSession.session).toBeDefined();
    expect(mockRegionWithSession.regionName).toBe("REGION1");
  });

  it("should allow cicsPlexName to be optional", () => {
    const mockRegionWithSession: ICICSRegionWithSession = {
      profile: {
        name: "testProfile",
        profile: {},
        type: "cics",
      } as IProfileLoaded,
      session: {} as CICSSession,
      regionName: "REGION1",
    };

    expect(mockRegionWithSession.cicsPlexName).toBeUndefined();
  });
});

