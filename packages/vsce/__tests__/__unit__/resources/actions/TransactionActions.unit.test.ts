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

import { ResourceAction, ResourceTypes, type IResourceContext, type ITransaction } from "@zowe/cics-for-zowe-explorer-api";
import { getTransactionActions } from "../../../../src/resources/actions/TransactionActions";

describe("Transaction Actions", () => {
  const mockResourceContext: IResourceContext = {
    profile: { name: "testProfile" } as any,
    session: {} as any,
    regionName: "TESTRGN",
    cicsplexName: "TESTPLEX",
  };

  const createMockTransaction = (status: string): ITransaction => ({
    eyu_cicsname: "TESTRGN",
    tranid: "MYTRAN",
    status,
    availstatus: "NONE",
    tranclass: "DFHTCL00",
    routing: "STATIC",
    program: "MYPROG",
  });

  describe("getTransactionActions", () => {
    it("should return an array of ResourceAction instances", () => {
      const actions = getTransactionActions();

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
      });
    });

    it("should return exactly 5 transaction actions", () => {
      const actions = getTransactionActions();

      expect(actions).toHaveLength(5);
    });

    it("should have correct resource type for all actions", () => {
      const actions = getTransactionActions();

      actions.forEach((action) => {
        expect(action.resourceType).toBe(ResourceTypes.CICSLocalTransaction);
      });
    });
  });

  describe("Action: INQUIRE", () => {
    it("should include INQUIRE action with correct id", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.INQUIRE")).toBeDefined();
    });

    it("should have correct action command for INQUIRE", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.INQUIRE")!;

      expect(action.action).toBe("cics-extension-for-zowe.inquireProgram");
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.INQUIRE")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: ENABLE", () => {
    it("should include ENABLE action with correct id", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.ENABLE")).toBeDefined();
    });

    it("should have correct action command for ENABLE", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.ENABLE")!;

      expect(action.action).toBe("cics-extension-for-zowe.enableTransaction");
    });

    it("should be visible when transaction is DISABLED", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.ENABLE")!;

      expect(action.visibleWhen!(createMockTransaction("DISABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when transaction is ENABLED", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.ENABLE")!;

      expect(action.visibleWhen!(createMockTransaction("ENABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: DISABLE", () => {
    it("should include DISABLE action with correct id", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.DISABLE")).toBeDefined();
    });

    it("should have correct action command for DISABLE", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.DISABLE")!;

      expect(action.action).toBe("cics-extension-for-zowe.disableTransaction");
    });

    it("should be visible when transaction is ENABLED", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.DISABLE")!;

      expect(action.visibleWhen!(createMockTransaction("ENABLED"), mockResourceContext)).toBe(true);
    });

    it("should NOT be visible when transaction is DISABLED", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.DISABLE")!;

      expect(action.visibleWhen!(createMockTransaction("DISABLED"), mockResourceContext)).toBe(false);
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should include COMPARE_TO action with correct id", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COMPARE_TO")).toBeDefined();
    });

    it("should have correct action command for COMPARE_TO", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COMPARE_TO")!;

      expect(action.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
    });

    it("should not refresh resource inspector after COMPARE_TO", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COMPARE_TO")!;

      expect(action.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COMPARE_TO")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should include COPY_NAME action with correct id", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COPY_NAME")).toBeDefined();
    });

    it("should have correct action command for COPY_NAME", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COPY_NAME")!;

      expect(action.action).toBe("cics-extension-for-zowe.copyResourceName");
    });

    it("should not refresh resource inspector after COPY_NAME", () => {
      const action = getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COPY_NAME")!;

      expect(action.refreshResourceInspector).toBe(false);
    });

    it("should have no visibleWhen condition (always visible)", () => {
      expect(getTransactionActions().find((a) => a.id === "CICS.CICSLocalTransaction.COPY_NAME")!.visibleWhen).toBeUndefined();
    });
  });

  describe("Visibility Logic - Enable/Disable Mutual Exclusivity", () => {
    it("should show ENABLE but not DISABLE when transaction is DISABLED", () => {
      const actions = getTransactionActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLocalTransaction.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSLocalTransaction.DISABLE")!;
      const transaction = createMockTransaction("DISABLED");

      expect(enableAction.visibleWhen!(transaction, mockResourceContext)).toBe(true);
      expect(disableAction.visibleWhen!(transaction, mockResourceContext)).toBe(false);
    });

    it("should show DISABLE but not ENABLE when transaction is ENABLED", () => {
      const actions = getTransactionActions();
      const enableAction = actions.find((a) => a.id === "CICS.CICSLocalTransaction.ENABLE")!;
      const disableAction = actions.find((a) => a.id === "CICS.CICSLocalTransaction.DISABLE")!;
      const transaction = createMockTransaction("ENABLED");

      expect(enableAction.visibleWhen!(transaction, mockResourceContext)).toBe(false);
      expect(disableAction.visibleWhen!(transaction, mockResourceContext)).toBe(true);
    });
  });

  describe("Action order", () => {
    it("should return actions in expected order", () => {
      const actions = getTransactionActions();

      expect(actions[0].id).toBe("CICS.CICSLocalTransaction.INQUIRE");
      expect(actions[1].id).toBe("CICS.CICSLocalTransaction.ENABLE");
      expect(actions[2].id).toBe("CICS.CICSLocalTransaction.DISABLE");
      expect(actions[3].id).toBe("CICS.CICSLocalTransaction.COMPARE_TO");
      expect(actions[4].id).toBe("CICS.CICSLocalTransaction.COPY_NAME");
    });
  });

  describe("Action IDs uniqueness", () => {
    it("should have unique action IDs", () => {
      const ids = getTransactionActions().map((a) => a.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Action immutability", () => {
    it("should return new instances on each call", () => {
      const actions1 = getTransactionActions();
      const actions2 = getTransactionActions();

      expect(actions1).not.toBe(actions2);
      expect(actions1[0]).not.toBe(actions2[0]);
    });
  });
});
