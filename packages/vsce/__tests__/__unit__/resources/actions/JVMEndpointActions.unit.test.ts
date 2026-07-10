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

import { ResourceAction, ResourceTypes, type IJVMEndpoint, type IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { getJVMEndpointActions } from "../../../../src/resources/actions/JVMEndpointActions";

describe("JVM Endpoint Actions", () => {
  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  const createMockJVMEndpoint = (enablestatus: string): IJVMEndpoint => ({
    eyu_cicsname: "TESTRGN",
    jvmendpoint: "TESTEP",
    jvmserver: "TESTJVM",
    enablestatus,
    port: "8080",
    secport: "8443",
  });

  describe("getJVMEndpointActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getJVMEndpointActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 4 JVM Endpoint actions", () => {
      const actions = getJVMEndpointActions();

      expect(actions).toHaveLength(4);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getJVMEndpointActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSJVMEndpoint);
      });
    });
  });

  describe("Action: ENABLE", () => {
    it("should include ENABLE action with correct id", () => {
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE");

      expect(enableAction).toBeDefined();
    });

    it("should have correct action command for ENABLE", () => {
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE")!;

      expect(enableAction.action).toBe("cics-extension-for-zowe.enableJVMEndpoint");
    });

    it("should be visible when JVM Endpoint is DISABLED", () => {
      const jvmEndpoint = createMockJVMEndpoint("DISABLED");
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE")!;

      expect(enableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when JVM Endpoint is ENABLED", () => {
      const jvmEndpoint = createMockJVMEndpoint("ENABLED");
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE")!;

      expect(enableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(false);
    });

    it("should refresh resource inspector after ENABLE", () => {
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE")!;

      expect(enableAction.refreshResourceInspector).toBe(true);
    });
  });

  describe("Action: DISABLE", () => {
    it("should include DISABLE action with correct id", () => {
      const actions = getJVMEndpointActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE");

      expect(disableAction).toBeDefined();
    });

    it("should have correct action command for DISABLE", () => {
      const actions = getJVMEndpointActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE")!;

      expect(disableAction.action).toBe("cics-extension-for-zowe.disableJVMEndpoint");
    });

    it("should be visible when JVM Endpoint is ENABLED", () => {
      const jvmEndpoint = createMockJVMEndpoint("ENABLED");
      const actions = getJVMEndpointActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE")!;

      expect(disableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when JVM Endpoint is DISABLED", () => {
      const jvmEndpoint = createMockJVMEndpoint("DISABLED");
      const actions = getJVMEndpointActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE")!;

      expect(disableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(false);
    });

    it("should refresh resource inspector after DISABLE", () => {
      const actions = getJVMEndpointActions();
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE")!;

      expect(disableAction.refreshResourceInspector).toBe(true);
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should include COPY_NAME action with correct id", () => {
      const actions = getJVMEndpointActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COPY_NAME");

      expect(copyAction).toBeDefined();
    });

    it("should have correct action command for COPY_NAME", () => {
      const actions = getJVMEndpointActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COPY_NAME")!;

      expect(copyAction.action).toBe("cics-extension-for-zowe.copyResourceName");
    });

    it("should not refresh resource inspector after COPY_NAME", () => {
      const actions = getJVMEndpointActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COPY_NAME")!;

      expect(copyAction.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      const actions = getJVMEndpointActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COPY_NAME")!;

      expect(copyAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Visibility Logic - Enable/Disable Mutual Exclusivity", () => {
    it("should show ENABLE but not DISABLE when JVM Endpoint is DISABLED", () => {
      const jvmEndpoint = createMockJVMEndpoint("DISABLED");
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE")!;

      expect(enableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(true);
      expect(disableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(false);
    });

    it("should show DISABLE but not ENABLE when JVM Endpoint is ENABLED", () => {
      const jvmEndpoint = createMockJVMEndpoint("ENABLED");
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE")!;

      expect(enableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(false);
      expect(disableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(true);
    });

    it("should show both ENABLE and DISABLE when JVM Endpoint is in transitional state", () => {
      const jvmEndpoint = createMockJVMEndpoint("ENABLING");
      const actions = getJVMEndpointActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.DISABLE")!;

      expect(enableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(true);
      expect(disableAction.visibleWhen!(jvmEndpoint, mockResourceContext)).toBe(true);
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      const actions = getJVMEndpointActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COMPARE_TO");

      expect(compareAction).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const actions = getJVMEndpointActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COMPARE_TO")!;

      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const actions = getJVMEndpointActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COMPARE_TO")!;

      expect(compareAction.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      const actions = getJVMEndpointActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSJVMEndpoint.COMPARE_TO")!;

      expect(compareAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order: ENABLE, DISABLE, COPY_NAME, COMPARE_TO", () => {
      const actions = getJVMEndpointActions();

      expect(actions[0].id).toBe("CICS.CICSJVMEndpoint.ENABLE");
      expect(actions[1].id).toBe("CICS.CICSJVMEndpoint.DISABLE");
      expect(actions[2].id).toBe("CICS.CICSJVMEndpoint.COPY_NAME");
      expect(actions[3].id).toBe("CICS.CICSJVMEndpoint.COMPARE_TO");
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const actions = getJVMEndpointActions();
      const ids = actions.map((a) => a.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getJVMEndpointActions();
      const actions2 = getJVMEndpointActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });
  });
});
