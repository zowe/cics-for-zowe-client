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

import { ResourceAction, ResourceTypes, type ILibrary, type IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { getLibraryActions } from "../../../../src/resources/actions/LibraryActions";

describe("Library Actions", () => {
  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  const createMockLibrary = (enablestatus: string): ILibrary => ({
    eyu_cicsname: "TESTRGN",
    name: "TESTLIB",
    dsname: "TEST.LIBRARY.DATASET",
    ranking: "1",
    numdsnames: "1",
    enablestatus,
  });

  describe("getLibraryActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getLibraryActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 3 library actions", () => {
      const actions = getLibraryActions();

      expect(actions).toHaveLength(3);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getLibraryActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSLibrary);
      });
    });
  });

  describe("Action: ENABLE", () => {
    it("should include ENABLE action with correct id", () => {
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE");

      expect(enableAction).toBeDefined();
    });

    it("should have correct action command for ENABLE", () => {
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;

      expect(enableAction.action).toBe("cics-extension-for-zowe.enableLibrary");
    });

    it("should have correct name for ENABLE action", () => {
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;

      expect(enableAction.name).toBeDefined();
      expect(typeof enableAction.name).toBe("string");
    });

    it("should be visible when library is DISABLED", () => {
      const library = createMockLibrary("DISABLED");
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;

      expect(enableAction.visibleWhen).toBeDefined();
      const isVisible = enableAction.visibleWhen!(library, mockResourceContext);
      expect(isVisible).toBe(true);
    });

    it("should NOT be visible when library is ENABLED", () => {
      const library = createMockLibrary("ENABLED");
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;

      expect(enableAction.visibleWhen).toBeDefined();
      const isVisible = enableAction.visibleWhen!(library, mockResourceContext);
      expect(isVisible).toBe(false);
    });

    it("should be visible when library is in any other status", () => {
      const library = createMockLibrary("DISABLING");
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;

      const isVisible = enableAction.visibleWhen!(library, mockResourceContext);
      expect(isVisible).toBe(true);
    });

    it("should have default refreshResourceInspector behavior", () => {
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;
      expect(enableAction.refreshResourceInspector).not.toBe(false);
    });
  });

  describe("Action: DISABLE", () => {
    it("should include DISABLE action with correct id", () => {
      const actions = getLibraryActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE");

      expect(disableAction).toBeDefined();
    });

    it("should have correct action command for DISABLE", () => {
      const actions = getLibraryActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      expect(disableAction.action).toBe("cics-extension-for-zowe.disableLibrary");
    });

    it("should have correct name for DISABLE action", () => {
      const actions = getLibraryActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      expect(disableAction.name).toBeDefined();
      expect(typeof disableAction.name).toBe("string");
    });

    it("should be visible when library is ENABLED", () => {
      const library = createMockLibrary("ENABLED");
      const actions = getLibraryActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      expect(disableAction.visibleWhen).toBeDefined();
      const isVisible = disableAction.visibleWhen!(library, mockResourceContext);
      expect(isVisible).toBe(true);
    });

    it("should NOT be visible when library is DISABLED", () => {
      const library = createMockLibrary("DISABLED");
      const actions = getLibraryActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      expect(disableAction.visibleWhen).toBeDefined();
      const isVisible = disableAction.visibleWhen!(library, mockResourceContext);
      expect(isVisible).toBe(false);
    });

    it("should be visible when library is in any other status", () => {
      const library = createMockLibrary("ENABLING");
      const actions = getLibraryActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      const isVisible = disableAction.visibleWhen!(library, mockResourceContext);
      expect(isVisible).toBe(true);
    });

    it("should have default refreshResourceInspector behavior", () => {
      const actions = getLibraryActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      expect(disableAction.refreshResourceInspector).not.toBe(false);
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      const actions = getLibraryActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO");

      expect(compareAction).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const actions = getLibraryActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO")!;

      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should have correct name for COMPARE_TO action", () => {
      const actions = getLibraryActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO")!;

      expect(compareAction.name).toBeDefined();
      expect(typeof compareAction.name).toBe("string");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const actions = getLibraryActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO")!;

      expect(compareAction.refreshResourceInspector).toBe(false);
    });

    it("should be visible for any library (no visibleWhen condition)", () => {
      const library = createMockLibrary("ENABLED");
      const actions = getLibraryActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO")!;

      if (compareAction.visibleWhen) {
        const isVisible = compareAction.visibleWhen(library, mockResourceContext);
        expect(isVisible).toBe(true);
      } else {
        expect(compareAction.visibleWhen).toBeUndefined();
      }
    });
  });

  describe("Visibility Logic - Enable/Disable Mutual Exclusivity", () => {
    it("should show ENABLE but not DISABLE when library is DISABLED", () => {
      const library = createMockLibrary("DISABLED");
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      const enableVisible = enableAction.visibleWhen!(library, mockResourceContext);
      const disableVisible = disableAction.visibleWhen!(library, mockResourceContext);

      expect(enableVisible).toBe(true);
      expect(disableVisible).toBe(false);
    });

    it("should show DISABLE but not ENABLE when library is ENABLED", () => {
      const library = createMockLibrary("ENABLED");
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      const enableVisible = enableAction.visibleWhen!(library, mockResourceContext);
      const disableVisible = disableAction.visibleWhen!(library, mockResourceContext);

      expect(enableVisible).toBe(false);
      expect(disableVisible).toBe(true);
    });

    it("should show both ENABLE and DISABLE when library is in transitional state", () => {
      const library = createMockLibrary("UNKNOWN");
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      const enableVisible = enableAction.visibleWhen!(library, mockResourceContext);
      const disableVisible = disableAction.visibleWhen!(library, mockResourceContext);

      expect(enableVisible).toBe(true);
      expect(disableVisible).toBe(true);
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const actions = getLibraryActions();
      const ids = actions.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order", () => {
      const actions = getLibraryActions();

      expect(actions[0].id).toBe("CICS.CICSLibrary.ENABLE");
      expect(actions[1].id).toBe("CICS.CICSLibrary.DISABLE");
      expect(actions[2].id).toBe("CICS.CICSLibrary.COMPARE_TO");
    });
  });

  describe("Integration with Resource Inspector", () => {
    it("should provide actions that can be executed from Resource Inspector", () => {
      const actions = getLibraryActions();

      expect(actions).toHaveLength(3);
      actions.forEach((action) => {
        expect(action.action).toBeDefined();
        expect(typeof action.action).toBe("string");
        expect(action.action).toMatch(/^cics-extension-for-zowe\./);
      });
    });

    it("should have COMPARE_TO action with refreshResourceInspector set to false", () => {
      const actions = getLibraryActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO")!;

      expect(compareAction.refreshResourceInspector).toBe(false);
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getLibraryActions();
      const actions2 = getLibraryActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });

    it("should return actions with same properties on each call", () => {
      const actions1 = getLibraryActions();
      const actions2 = getLibraryActions();

      expect(actions1.length).toBe(actions2.length);
      actions1.forEach((action1, index) => {
        const action2 = actions2[index];
        expect(action1.id).toBe(action2.id);
        expect(action1.action).toBe(action2.action);
        expect(action1.resourceType).toBe(action2.resourceType);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string enablestatus", () => {
      const library = createMockLibrary("");
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSLibrary.DISABLE")!;

      const enableVisible = enableAction.visibleWhen!(library, mockResourceContext);
      const disableVisible = disableAction.visibleWhen!(library, mockResourceContext);

      expect(enableVisible).toBe(true);
      expect(disableVisible).toBe(true);
    });

    it("should handle case-sensitive enablestatus comparison", () => {
      const library = createMockLibrary("enabled"); // lowercase
      const actions = getLibraryActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLibrary.ENABLE")!;

      const isVisible = enableAction.visibleWhen!(library, mockResourceContext);
      expect(isVisible).toBe(true);
    });
  });
});
