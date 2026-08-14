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

import { ResourceAction, ResourceTypes, type IProgram, type IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { getProgramActions } from "../../../../src/resources/actions/ProgramActions";

describe("Program Actions", () => {
  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  const createMockProgram = (status: string): IProgram => ({
    eyu_cicsname: "TESTRGN",
    program: "TESTPROG",
    status,
    progtype: "PROGRAM",
    newcopycnt: "0",
    language: "COBOL",
    usecount: "0",
    library: "TESTLIB",
    librarydsn: "TEST.LIB.DS",
    jvmserver: "",
  });

  describe("getProgramActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getProgramActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 7 program actions", () => {
      const actions = getProgramActions();

      expect(actions).toHaveLength(7);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getProgramActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSProgram);
      });
    });
  });

  describe("Action: NEWCOPY", () => {
    it("should include NEWCOPY action with correct id", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.NEWCOPY")).toBeDefined();
    });

    it("should have correct action command for NEWCOPY", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.NEWCOPY")!;

      expect(action.action).toBe("cics-extension-for-zowe.newCopyProgram");
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.NEWCOPY")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: PHASEIN", () => {
    it("should include PHASEIN action with correct id", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.PHASEIN")).toBeDefined();
    });

    it("should have correct action command for PHASEIN", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.PHASEIN")!;

      expect(action.action).toBe("cics-extension-for-zowe.phaseInCommand");
    });
  });

  describe("Action: DISABLE", () => {
    it("should include DISABLE action with correct id", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.DISABLE")).toBeDefined();
    });

    it("should have correct action command for DISABLE", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.DISABLE")!;

      expect(action.action).toBe("cics-extension-for-zowe.disableProgram");
    });

    it("should be visible when program is ENABLED", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.DISABLE")!;

      expect(action.visibleWhen!(createMockProgram("ENABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when program is DISABLED", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.DISABLE")!;

      expect(action.visibleWhen!(createMockProgram("DISABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: ENABLE", () => {
    it("should include ENABLE action with correct id", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.ENABLE")).toBeDefined();
    });

    it("should have correct action command for ENABLE", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.ENABLE")!;

      expect(action.action).toBe("cics-extension-for-zowe.enableProgram");
    });

    it("should be visible when program is DISABLED", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.ENABLE")!;

      expect(action.visibleWhen!(createMockProgram("DISABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when program is ENABLED", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.ENABLE")!;

      expect(action.visibleWhen!(createMockProgram("ENABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: SHOWLIBRARY", () => {
    it("should include SHOWLIBRARY action with correct id", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.SHOWLIBRARY")).toBeDefined();
    });

    it("should have correct action command for SHOWLIBRARY", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.SHOWLIBRARY")!;

      expect(action.action).toBe("cics-extension-for-zowe.showLibrary");
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.COMPARE_TO")).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.COMPARE_TO")!;

      expect(action.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.COMPARE_TO")!;

      expect(action.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.COMPARE_TO")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should include COPY_NAME action with correct id", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.COPY_NAME")).toBeDefined();
    });

    it("should have correct action command for COPY_NAME", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.COPY_NAME")!;

      expect(action.action).toBe("cics-extension-for-zowe.copyResourceName");
    });

    it("should not refresh resource inspector after COPY_NAME", () => {
      const action = getProgramActions().find((a) => a.id === "CICS.CICSProgram.COPY_NAME")!;

      expect(action.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getProgramActions().find((a) => a.id === "CICS.CICSProgram.COPY_NAME")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Visibility Logic - Enable/Disable Mutual Exclusivity", () => {
    it("should show ENABLE but not DISABLE when program is DISABLED", () => {
      const actions = getProgramActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSProgram.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSProgram.DISABLE")!;
      const program = createMockProgram("DISABLED");

      expect(enableAction.visibleWhen!(program, mockResourceContext)).toBe(true);
      expect(disableAction.visibleWhen!(program, mockResourceContext)).toBe(false);
    });

    it("should show DISABLE but not ENABLE when program is ENABLED", () => {
      const actions = getProgramActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSProgram.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSProgram.DISABLE")!;
      const program = createMockProgram("ENABLED");

      expect(enableAction.visibleWhen!(program, mockResourceContext)).toBe(false);
      expect(disableAction.visibleWhen!(program, mockResourceContext)).toBe(true);
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order", () => {
      const actions = getProgramActions();

      expect(actions[0].id).toBe("CICS.CICSProgram.NEWCOPY");
      expect(actions[1].id).toBe("CICS.CICSProgram.PHASEIN");
      expect(actions[2].id).toBe("CICS.CICSProgram.DISABLE");
      expect(actions[3].id).toBe("CICS.CICSProgram.ENABLE");
      expect(actions[4].id).toBe("CICS.CICSProgram.SHOWLIBRARY");
      expect(actions[5].id).toBe("CICS.CICSProgram.COMPARE_TO");
      expect(actions[6].id).toBe("CICS.CICSProgram.COPY_NAME");
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const ids = getProgramActions().map((a) => a.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getProgramActions();
      const actions2 = getProgramActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });
  });
});
