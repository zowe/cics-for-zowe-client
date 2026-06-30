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

import { ResourceAction, ResourceTypes, type IResourceContext, type ITask } from "@zowe/cics-for-zowe-explorer-api";
import { getTaskActions } from "../../../../src/resources/actions/TaskActions";

describe("Task Actions", () => {
  const mockTask: ITask = {
    eyu_cicsname: "TESTRGN",
    task: "00001",
    tranid: "CEMT",
    currentprog: "DFHCEMT",
    userid: "TESTUSER",
    runstatus: "RUNNING",
    suspendtime: "",
    suspendtype: "",
    suspendvalue: "",
  };

  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  describe("getTaskActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getTaskActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 3 task actions", () => {
      const actions = getTaskActions();

      expect(actions).toHaveLength(3);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getTaskActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSTask);
      });
    });
  });

  describe("Action: PURGE", () => {
    it("should include PURGE action with correct id", () => {
      const actions = getTaskActions();
      const purgeAction = actions.find((a) => a.id === "CICS.CICSTask.PURGE");

      expect(purgeAction).toBeDefined();
    });

    it("should have correct action command for PURGE", () => {
      const actions = getTaskActions();
      const purgeAction = actions.find((a) => a.id === "CICS.CICSTask.PURGE")!;

      expect(purgeAction.action).toBe("cics-extension-for-zowe.purgeTask");
    });

    it("should have correct name for PURGE action", () => {
      const actions = getTaskActions();
      const purgeAction = actions.find((a) => a.id === "CICS.CICSTask.PURGE")!;

      expect(purgeAction.name).toBeDefined();
      expect(typeof purgeAction.name).toBe("string");
    });

    it("should not refresh resource inspector after PURGE", () => {
      const actions = getTaskActions();
      const purgeAction = actions.find((a) => a.id === "CICS.CICSTask.PURGE")!;

      expect(purgeAction.refreshResourceInspector).toBe(false);
    });

    it("should be visible for any task (no visibleWhen condition)", () => {
      const actions = getTaskActions();
      const purgeAction = actions.find((a) => a.id === "CICS.CICSTask.PURGE")!;
      if (purgeAction.visibleWhen) {
        const isVisible = purgeAction.visibleWhen(mockTask, mockResourceContext);
        expect(isVisible).toBe(true);
      } else {
        expect(purgeAction.visibleWhen).toBeUndefined();
      }
    });
  });

  describe("Action: INQUIRE_TRANSACTION", () => {
    it("should include INQUIRE_TRANSACTION action with correct id", () => {
      const actions = getTaskActions();
      const inquireAction = actions.find((a) => a.id === "CICS.CICSTask.INQUIRE_TRANSACTION");

      expect(inquireAction).toBeDefined();
    });

    it("should have correct action command for INQUIRE_TRANSACTION", () => {
      const actions = getTaskActions();
      const inquireAction = actions.find((a) => a.id === "CICS.CICSTask.INQUIRE_TRANSACTION")!;

      expect(inquireAction.action).toBe("cics-extension-for-zowe.inquireTransaction");
    });

    it("should have correct name for INQUIRE_TRANSACTION action", () => {
      const actions = getTaskActions();
      const inquireAction = actions.find((a) => a.id === "CICS.CICSTask.INQUIRE_TRANSACTION")!;

      expect(inquireAction.name).toBeDefined();
      expect(typeof inquireAction.name).toBe("string");
    });

    it("should not refresh resource inspector after INQUIRE_TRANSACTION", () => {
      const actions = getTaskActions();
      const inquireAction = actions.find((a) => a.id === "CICS.CICSTask.INQUIRE_TRANSACTION")!;

      expect(inquireAction.refreshResourceInspector).toBe(false);
    });

    it("should be visible for any task (no visibleWhen condition)", () => {
      const actions = getTaskActions();
      const inquireAction = actions.find((a) => a.id === "CICS.CICSTask.INQUIRE_TRANSACTION")!;
      if (inquireAction.visibleWhen) {
        const isVisible = inquireAction.visibleWhen(mockTask, mockResourceContext);
        expect(isVisible).toBe(true);
      } else {
        expect(inquireAction.visibleWhen).toBeUndefined();
      }
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      const actions = getTaskActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSTask.COMPARE_TO");

      expect(compareAction).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const actions = getTaskActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSTask.COMPARE_TO")!;

      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should have correct name for COMPARE_TO action", () => {
      const actions = getTaskActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSTask.COMPARE_TO")!;

      expect(compareAction.name).toBeDefined();
      expect(typeof compareAction.name).toBe("string");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const actions = getTaskActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSTask.COMPARE_TO")!;

      expect(compareAction.refreshResourceInspector).toBe(false);
    });

    it("should be visible for any task (no visibleWhen condition)", () => {
      const actions = getTaskActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSTask.COMPARE_TO")!;
      if (compareAction.visibleWhen) {
        const isVisible = compareAction.visibleWhen(mockTask, mockResourceContext);
        expect(isVisible).toBe(true);
      } else {
        expect(compareAction.visibleWhen).toBeUndefined();
      }
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const actions = getTaskActions();
      const ids = actions.map((a) => a.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order", () => {
      const actions = getTaskActions();

      expect(actions[0].id).toBe("CICS.CICSTask.PURGE");
      expect(actions[1].id).toBe("CICS.CICSTask.INQUIRE_TRANSACTION");
      expect(actions[2].id).toBe("CICS.CICSTask.COMPARE_TO");
    });
  });

  describe("Integration with Resource Inspector", () => {
    it("should provide actions that can be executed from Resource Inspector", () => {
      const actions = getTaskActions();

      expect(actions).toHaveLength(3);
      actions.forEach((action) => {
        expect(action.action).toBeDefined();
        expect(typeof action.action).toBe("string");
        expect(action.action).toMatch(/^cics-extension-for-zowe\./);
      });
    });

    it("should have all actions with refreshResourceInspector set to false", () => {
      const actions = getTaskActions();

      actions.forEach((action) => {
        expect(action.refreshResourceInspector).toBe(false);
      });
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getTaskActions();
      const actions2 = getTaskActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });

    it("should return actions with same properties on each call", () => {
      const actions1 = getTaskActions();
      const actions2 = getTaskActions();

      expect(actions1.length).toBe(actions2.length);
      actions1.forEach((action1, index) => {
        const action2 = actions2[index];
        expect(action1.id).toBe(action2.id);
        expect(action1.action).toBe(action2.action);
        expect(action1.resourceType).toBe(action2.resourceType);
      });
    });
  });
});
