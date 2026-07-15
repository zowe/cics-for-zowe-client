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

import { ResourceAction, ResourceTypes, type IJVMServer, type IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { getJVMServerActions } from "../../../../src/resources/actions/JVMServerActions";

describe("JVM Server Actions", () => {
  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  const createMockJVMServer = (enablestatus: string): IJVMServer => ({
    eyu_cicsname: "TESTRGN",
    name: "TESTJVM",
    enablestatus,
    profile: "DFHOSGI",
    javahome: "/usr/java/java8",
    threadlimit: "10",
    log: "/tmp/jvm.log",
    definetime: "2025-01-01T00:00:00.000000+00:00",
    changetime: "2025-01-01T00:00:00.000000+00:00",
    changeusrid: "EXPAUTO",
  });

  describe("getJVMServerActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getJVMServerActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 4 JVM Server actions", () => {
      const actions = getJVMServerActions();

      expect(actions).toHaveLength(4);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getJVMServerActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSJVMServer);
      });
    });
  });

  describe("Action: ENABLE", () => {
    it("should include ENABLE action with correct id", () => {
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE");

      expect(enableAction).toBeDefined();
    });

    it("should have correct action command for ENABLE", () => {
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE")!;

      expect(enableAction.action).toBe("cics-extension-for-zowe.enableJVMServer");
    });

    it("should be visible when JVM Server is DISABLED", () => {
      const jvmServer = createMockJVMServer("DISABLED");
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE")!;

      expect(enableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when JVM Server is ENABLED", () => {
      const jvmServer = createMockJVMServer("ENABLED");
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE")!;

      expect(enableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(false);
    });

    it("should refresh resource inspector after ENABLE", () => {
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE")!;

      expect(enableAction.refreshResourceInspector).toBe(true);
    });
  });

  describe("Action: DISABLE", () => {
    it("should include DISABLE action with correct id", () => {
      const actions = getJVMServerActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE");

      expect(disableAction).toBeDefined();
    });

    it("should have correct action command for DISABLE", () => {
      const actions = getJVMServerActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE")!;

      expect(disableAction.action).toBe("cics-extension-for-zowe.disableJVMServer");
    });

    it("should be visible when JVM Server is ENABLED", () => {
      const jvmServer = createMockJVMServer("ENABLED");
      const actions = getJVMServerActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE")!;

      expect(disableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when JVM Server is DISABLED", () => {
      const jvmServer = createMockJVMServer("DISABLED");
      const actions = getJVMServerActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE")!;

      expect(disableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(false);
    });

    it("should refresh resource inspector after DISABLE", () => {
      const actions = getJVMServerActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE")!;

      expect(disableAction.refreshResourceInspector).toBe(true);
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should include COPY_NAME action with correct id", () => {
      const actions = getJVMServerActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COPY_NAME");

      expect(copyAction).toBeDefined();
    });

    it("should have correct action command for COPY_NAME", () => {
      const actions = getJVMServerActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COPY_NAME")!;

      expect(copyAction.action).toBe("cics-extension-for-zowe.copyResourceName");
    });

    it("should not refresh resource inspector after COPY_NAME", () => {
      const actions = getJVMServerActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COPY_NAME")!;

      expect(copyAction.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      const actions = getJVMServerActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COPY_NAME")!;

      expect(copyAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Visibility Logic - Enable/Disable Mutual Exclusivity", () => {
    it("should show ENABLE but not DISABLE when JVM Server is DISABLED", () => {
      const jvmServer = createMockJVMServer("DISABLED");
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE")!;

      expect(enableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(true);
      expect(disableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(false);
    });

    it("should show DISABLE but not ENABLE when JVM Server is ENABLED", () => {
      const jvmServer = createMockJVMServer("ENABLED");
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE")!;

      expect(enableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(false);
      expect(disableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(true);
    });

    it("should show both ENABLE and DISABLE when JVM Server is in transitional state", () => {
      const jvmServer = createMockJVMServer("ENABLING");
      const actions = getJVMServerActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMServer.DISABLE")!;

      expect(enableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(true);
      expect(disableAction.visibleWhen!(jvmServer, mockResourceContext)).toBe(true);
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      const actions = getJVMServerActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COMPARE_TO");

      expect(compareAction).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const actions = getJVMServerActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COMPARE_TO")!;

      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const actions = getJVMServerActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COMPARE_TO")!;

      expect(compareAction.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      const actions = getJVMServerActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMServer.COMPARE_TO")!;

      expect(compareAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order: ENABLE, DISABLE, COPY_NAME, COMPARE_TO", () => {
      const actions = getJVMServerActions();

      expect(actions[0].id).toBe("CICS.CICSJVMServer.ENABLE");
      expect(actions[1].id).toBe("CICS.CICSJVMServer.DISABLE");
      expect(actions[2].id).toBe("CICS.CICSJVMServer.COPY_NAME");
      expect(actions[3].id).toBe("CICS.CICSJVMServer.COMPARE_TO");
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const actions = getJVMServerActions();
      const ids = actions.map((a) => a.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getJVMServerActions();
      const actions2 = getJVMServerActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });
  });
});
