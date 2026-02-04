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

import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { getRegionActions } from "../../../../src/resources/actions/RegionActions";

describe("Region Actions from Resource Inspector", () => {
  const mockRegion = {
    cicsname: "TEST1",
    cicsstatus: "ACTIVE",
    applid: "TEST1",
    startup: "AUTOSTART",
  };

  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TEST1",
  };

  describe("Region Actions from Resource Inspector", () => {
    it("should provide actions that can be executed from Resource Inspector", () => {
      const actions = getRegionActions();
      expect(actions).toHaveLength(2);
    });
    it("should be visible when region is ACTIVE", () => {
      const actions = getRegionActions();
      const sitParamsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWSITPARAMETERS")!;

      const isVisible = sitParamsAction.visibleWhen(mockRegion as any, mockResourceContext);

      expect(isVisible).toBe(true);
    });
    it("should not be visible when region is INACTIVE", () => {
      const inactiveRegion = { ...mockRegion, cicsstatus: "INACTIVE" };
      const actions = getRegionActions();
      const sitParamsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWSITPARAMETERS")!;

      const isVisible = sitParamsAction.visibleWhen(inactiveRegion as any, mockResourceContext);

      expect(isVisible).toBe(false);
    });
    it("should be visible when region is ACTIVE", () => {
      const actions = getRegionActions();
      const logsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWREGIONLOGS")!;

      const isVisible = logsAction.visibleWhen(mockRegion as any, mockResourceContext);

      expect(isVisible).toBe(true);
    });

    it("should not be visible when region is INACTIVE", () => {
      const inactiveRegion = { ...mockRegion, cicsstatus: "INACTIVE" };
      const actions = getRegionActions();
      const logsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWREGIONLOGS")!;

      const isVisible = logsAction.visibleWhen(inactiveRegion as any, mockResourceContext);

      expect(isVisible).toBe(false);
    });
  });
});
