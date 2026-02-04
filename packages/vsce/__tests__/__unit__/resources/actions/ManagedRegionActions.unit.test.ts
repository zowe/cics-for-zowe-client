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
import { getManagedRegionActions } from "../../../../src/resources/actions/ManagedRegionActions";

describe("Managed Region Actions from Resource Inspector", () => {
  const mockRegion = {
    cicsname: "TEST1",
    cicsstate: "ACTIVE",
    secbypass: "NO",
    wlmstatus: "YES",
  };

  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TEST1",
    cicsplexName: "PLEX1",
  };

  describe("Integration with Resource Inspector", () => {
    it("should provide actions that can be executed from Resource Inspector", () => {
      const managedActions = getManagedRegionActions();
      expect(managedActions).toHaveLength(2);
    });
    it("should be visible when region is ACTIVE", () => {
      const actions = getManagedRegionActions();
      const sitParamsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWSITPARAMETERS")!;

      const isVisible = sitParamsAction.visibleWhen(mockRegion as any, mockResourceContext);

      expect(isVisible).toBe(true);
    });

    it("should not be visible when region is INACTIVE", () => {
      const inactiveRegion = { ...mockRegion, cicsstate: "INACTIVE" };
      const actions = getManagedRegionActions();
      const sitParamsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWSITPARAMETERS")!;

      const isVisible = sitParamsAction.visibleWhen(inactiveRegion as any, mockResourceContext);

      expect(isVisible).toBe(false);
    });
    it("should be visible when region is ACTIVE", () => {
      const actions = getManagedRegionActions();
      const logsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWREGIONLOGS")!;

      const isVisible = logsAction.visibleWhen(mockRegion as any, mockResourceContext);

      expect(isVisible).toBe(true);
    });

    it("should not be visible when region is INACTIVE", () => {
      const inactiveRegion = { ...mockRegion, cicsstate: "INACTIVE" };
      const actions = getManagedRegionActions();
      const logsAction = actions.find((a) => a.id === "CICS.CICSRegion.SHOWREGIONLOGS")!;

      const isVisible = logsAction.visibleWhen(inactiveRegion as any, mockResourceContext);

      expect(isVisible).toBe(false);
    });
  });
});
