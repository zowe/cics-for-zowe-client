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

import { ResourceAction, ResourceTypes, type ILocalFile, type IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { getLocalFileActions } from "../../../../src/resources/actions/LocalFileActions";

describe("Local File Actions", () => {
  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  const createMockLocalFile = (openstatus: string, enablestatus: string): ILocalFile => ({
    eyu_cicsname: "TESTRGN",
    file: "TESTFILE",
    openstatus,
    enablestatus,
    dsname: "TEST.DATASET",
    vsamtype: "KSDS",
    keylength: "10",
    recordsize: "100",
    browse: "BROWSABLE",
    read: "READABLE",
    update: "UPDATABLE",
    add: "ADDABLE",
    delete: "DELETABLE",
  });

  describe("getLocalFileActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getLocalFileActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 6 local file actions", () => {
      const actions = getLocalFileActions();

      expect(actions).toHaveLength(6);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getLocalFileActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSLocalFile);
      });
    });
  });

  describe("Action: OPEN", () => {
    it("should include OPEN action with correct id", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.OPEN")).toBeDefined();
    });

    it("should have correct action command for OPEN", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.OPEN")!;

      expect(action.action).toBe("cics-extension-for-zowe.openLocalFile");
    });

    it("should be visible when file is CLOSED", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.OPEN")!;

      expect(action.visibleWhen!(createMockLocalFile("CLOSED", "ENABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when file is OPEN", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.OPEN")!;

      expect(action.visibleWhen!(createMockLocalFile("OPEN", "ENABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: CLOSE", () => {
    it("should include CLOSE action with correct id", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.CLOSE")).toBeDefined();
    });

    it("should have correct action command for CLOSE", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.CLOSE")!;

      expect(action.action).toBe("cics-extension-for-zowe.closeLocalFile");
    });

    it("should be visible when file is OPEN", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.CLOSE")!;

      expect(action.visibleWhen!(createMockLocalFile("OPEN", "ENABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when file is CLOSED", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.CLOSE")!;

      expect(action.visibleWhen!(createMockLocalFile("CLOSED", "ENABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: ENABLE", () => {
    it("should include ENABLE action with correct id", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.ENABLE")).toBeDefined();
    });

    it("should have correct action command for ENABLE", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.ENABLE")!;

      expect(action.action).toBe("cics-extension-for-zowe.enableLocalFile");
    });

    it("should be visible when file is DISABLED", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.ENABLE")!;

      expect(action.visibleWhen!(createMockLocalFile("OPEN", "DISABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when file is ENABLED", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.ENABLE")!;

      expect(action.visibleWhen!(createMockLocalFile("OPEN", "ENABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: DISABLE", () => {
    it("should include DISABLE action with correct id", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.DISABLE")).toBeDefined();
    });

    it("should have correct action command for DISABLE", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.DISABLE")!;

      expect(action.action).toBe("cics-extension-for-zowe.disableLocalFile");
    });

    it("should be visible when file is ENABLED", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.DISABLE")!;

      expect(action.visibleWhen!(createMockLocalFile("OPEN", "ENABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when file is DISABLED", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.DISABLE")!;

      expect(action.visibleWhen!(createMockLocalFile("OPEN", "DISABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COMPARE_TO")).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COMPARE_TO")!;

      expect(action.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COMPARE_TO")!;

      expect(action.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COMPARE_TO")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should include COPY_NAME action with correct id", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COPY_NAME")).toBeDefined();
    });

    it("should have correct action command for COPY_NAME", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COPY_NAME")!;

      expect(action.action).toBe("cics-extension-for-zowe.copyResourceName");
    });

    it("should not refresh resource inspector after COPY_NAME", () => {
      const action = getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COPY_NAME")!;

      expect(action.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getLocalFileActions().find((a) => a.id === "CICS.CICSLocalFile.COPY_NAME")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order", () => {
      const actions = getLocalFileActions();

      expect(actions[0].id).toBe("CICS.CICSLocalFile.OPEN");
      expect(actions[1].id).toBe("CICS.CICSLocalFile.CLOSE");
      expect(actions[2].id).toBe("CICS.CICSLocalFile.ENABLE");
      expect(actions[3].id).toBe("CICS.CICSLocalFile.DISABLE");
      expect(actions[4].id).toBe("CICS.CICSLocalFile.COMPARE_TO");
      expect(actions[5].id).toBe("CICS.CICSLocalFile.COPY_NAME");
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const ids = getLocalFileActions().map((a) => a.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getLocalFileActions();
      const actions2 = getLocalFileActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });
  });
});
