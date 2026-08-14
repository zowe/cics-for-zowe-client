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

import { ResourceAction, ResourceTypes, type IBundle, type IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { getBundleActions } from "../../../../src/resources/actions/BundleActions";

describe("Bundle Actions", () => {
  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  const createMockBundle = (enablestatus: string): IBundle => ({
    eyu_cicsname: "TESTRGN",
    name: "TESTBUNDLE",
    enablestatus,
    bundledir: "/u/test/bundle",
    bundleid: "TESTBDL",
    availstatus: "NONE",
    partcount: "1",
  });

  describe("getBundleActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getBundleActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 4 bundle actions", () => {
      const actions = getBundleActions();

      expect(actions).toHaveLength(4);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getBundleActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSBundle);
      });
    });
  });

  describe("Action: ENABLE", () => {
    it("should include ENABLE action with correct id", () => {
      const actions = getBundleActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSBundle.ENABLE");

      expect(enableAction).toBeDefined();
    });

    it("should have correct action command for ENABLE", () => {
      const actions = getBundleActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSBundle.ENABLE")!;

      expect(enableAction.action).toBe("cics-extension-for-zowe.enableBundle");
    });

    it("should be visible when bundle is DISABLED", () => {
      const bundle = createMockBundle("DISABLED");
      const actions = getBundleActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSBundle.ENABLE")!;

      expect(enableAction.visibleWhen!(bundle, mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when bundle is ENABLED", () => {
      const bundle = createMockBundle("ENABLED");
      const actions = getBundleActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSBundle.ENABLE")!;

      expect(enableAction.visibleWhen!(bundle, mockResourceContext)).toBe(false);
    });
  });

  describe("Action: DISABLE", () => {
    it("should include DISABLE action with correct id", () => {
      const actions = getBundleActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSBundle.DISABLE");

      expect(disableAction).toBeDefined();
    });

    it("should have correct action command for DISABLE", () => {
      const actions = getBundleActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSBundle.DISABLE")!;

      expect(disableAction.action).toBe("cics-extension-for-zowe.disableBundle");
    });

    it("should be visible when bundle is ENABLED", () => {
      const bundle = createMockBundle("ENABLED");
      const actions = getBundleActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSBundle.DISABLE")!;

      expect(disableAction.visibleWhen!(bundle, mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when bundle is DISABLED", () => {
      const bundle = createMockBundle("DISABLED");
      const actions = getBundleActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSBundle.DISABLE")!;

      expect(disableAction.visibleWhen!(bundle, mockResourceContext)).toBe(false);
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      const actions = getBundleActions();

      expect(actions.find((a) => a.id === "CICS.CICSBundle.COMPARE_TO")).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const actions = getBundleActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSBundle.COMPARE_TO")!;

      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const actions = getBundleActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSBundle.COMPARE_TO")!;

      expect(compareAction.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      const actions = getBundleActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSBundle.COMPARE_TO")!;

      expect(compareAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should include COPY_NAME action with correct id", () => {
      const actions = getBundleActions();

      expect(actions.find((a) => a.id === "CICS.CICSBundle.COPY_NAME")).toBeDefined();
    });

    it("should have correct action command for COPY_NAME", () => {
      const actions = getBundleActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSBundle.COPY_NAME")!;

      expect(copyAction.action).toBe("cics-extension-for-zowe.copyResourceName");
    });

    it("should not refresh resource inspector after COPY_NAME", () => {
      const actions = getBundleActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSBundle.COPY_NAME")!;

      expect(copyAction.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      const actions = getBundleActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSBundle.COPY_NAME")!;

      expect(copyAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Visibility Logic - Enable/Disable Mutual Exclusivity", () => {
    it("should show ENABLE but not DISABLE when bundle is DISABLED", () => {
      const bundle = createMockBundle("DISABLED");
      const actions = getBundleActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSBundle.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSBundle.DISABLE")!;

      expect(enableAction.visibleWhen!(bundle, mockResourceContext)).toBe(true);
      expect(disableAction.visibleWhen!(bundle, mockResourceContext)).toBe(false);
    });

    it("should show DISABLE but not ENABLE when bundle is ENABLED", () => {
      const bundle = createMockBundle("ENABLED");
      const actions = getBundleActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSBundle.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSBundle.DISABLE")!;

      expect(enableAction.visibleWhen!(bundle, mockResourceContext)).toBe(false);
      expect(disableAction.visibleWhen!(bundle, mockResourceContext)).toBe(true);
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order: ENABLE, DISABLE, COMPARE_TO, COPY_NAME", () => {
      const actions = getBundleActions();

      expect(actions[0].id).toBe("CICS.CICSBundle.ENABLE");
      expect(actions[1].id).toBe("CICS.CICSBundle.DISABLE");
      expect(actions[2].id).toBe("CICS.CICSBundle.COMPARE_TO");
      expect(actions[3].id).toBe("CICS.CICSBundle.COPY_NAME");
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const actions = getBundleActions();
      const ids = actions.map((a) => a.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getBundleActions();
      const actions2 = getBundleActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });
  });
});
