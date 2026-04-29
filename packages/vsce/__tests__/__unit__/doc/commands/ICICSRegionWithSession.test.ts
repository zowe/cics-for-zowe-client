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

describe("ICICSRegionWithSession", () => {
  it("should define the interface structure", () => {
    const mockRegionWithSession: ICICSRegionWithSession = {
      profile: {
        name: "testProfile",
        profile: {},
        type: "cics",
      } as unknown as ICICSRegionWithSession["profile"],
      cicsPlexName: "PLEX1",
      session: {} as unknown as ICICSRegionWithSession["session"],
      regionName: "REGION1",
    };

    expect(mockRegionWithSession.profile).toBeDefined();
    expect(mockRegionWithSession.cicsPlexName).toBe("PLEX1");
    expect(mockRegionWithSession.session).toBeDefined();
    expect(mockRegionWithSession.regionName).toBe("REGION1");
  });

  it("should allow optional cicsPlexName", () => {
    const mockRegionWithSession: ICICSRegionWithSession = {
      profile: {
        name: "testProfile",
        profile: {},
        type: "cics",
      } as unknown as ICICSRegionWithSession["profile"],
      cicsPlexName: undefined,
      session: {} as unknown as ICICSRegionWithSession["session"],
      regionName: "REGION1",
    };

    expect(mockRegionWithSession.cicsPlexName).toBeUndefined();
  });
});


