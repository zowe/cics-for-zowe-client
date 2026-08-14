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

import { ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { getBuiltInResourceActions } from "../../../../src/resources/actions";

describe("Resource Inspector Actions Integration", () => {
  describe("Library Actions in RI", () => {
    it("should register Library actions in the built-in actions map", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary);

      expect(libraryActions).toBeDefined();
      expect(libraryActions).toHaveLength(4);
    });

    it("should include ENABLE action for Library in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary);
      const enableAction = libraryActions.find((a) => a.id === "CICS.CICSLibrary.ENABLE");

      expect(enableAction).toBeDefined();
      expect(enableAction?.action).toBe("cics-extension-for-zowe.enableLibrary");
    });

    it("should include DISABLE action for Library in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary);
      const disableAction = libraryActions.find((a) => a.id === "CICS.CICSLibrary.DISABLE");

      expect(disableAction).toBeDefined();
      expect(disableAction?.action).toBe("cics-extension-for-zowe.disableLibrary");
    });

    it("should include COMPARE_TO action for Library in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary);
      const compareAction = libraryActions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COPY_NAME action for Library in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary);
      const copyAction = libraryActions.find((a) => a.id === "CICS.CICSLibrary.COPY_NAME");

      expect(copyAction).toBeDefined();
      expect(copyAction?.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction?.refreshResourceInspector).toBe(false);
    });

  });

  describe("Task Actions in RI", () => {
    it("should register Task actions in the built-in actions map", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask);

      expect(taskActions).toBeDefined();
      expect(taskActions).toHaveLength(4);
    });

    it("should include PURGE action for Task in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask);
      const purgeAction = taskActions.find((a) => a.id === "CICS.CICSTask.PURGE");

      expect(purgeAction).toBeDefined();
      expect(purgeAction?.action).toBe("cics-extension-for-zowe.purgeTask");
      expect(purgeAction?.refreshResourceInspector).toBe(false);
    });

    it("should include INQUIRE_TRANSACTION action for Task in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask);
      const inquireAction = taskActions.find((a) => a.id === "CICS.CICSTask.INQUIRE_TRANSACTION");

      expect(inquireAction).toBeDefined();
      expect(inquireAction?.action).toBe("cics-extension-for-zowe.inquireTransaction");
      expect(inquireAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COMPARE_TO action for Task in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask);
      const compareAction = taskActions.find((a) => a.id === "CICS.CICSTask.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COPY_NAME action for Task in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask);
      const copyAction = taskActions.find((a) => a.id === "CICS.CICSTask.COPY_NAME");

      expect(copyAction).toBeDefined();
      expect(copyAction?.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction?.refreshResourceInspector).toBe(false);
    });
  });

  describe("Program Actions in RI", () => {
    it("should register Program actions in the built-in actions map", () => {
      const actionsMap = getBuiltInResourceActions();
      const programActions = actionsMap.get(ResourceTypes.CICSProgram);

      expect(programActions).toBeDefined();
      expect(programActions).toHaveLength(7);
    });

    it("should include COPY_NAME action for Program in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const programActions = actionsMap.get(ResourceTypes.CICSProgram);
      const copyAction = programActions.find((a) => a.id === "CICS.CICSProgram.COPY_NAME");

      expect(copyAction).toBeDefined();
      expect(copyAction?.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COMPARE_TO action for Program in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const programActions = actionsMap.get(ResourceTypes.CICSProgram);
      const compareAction = programActions.find((a) => a.id === "CICS.CICSProgram.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });
  });

  describe("Transaction Actions in RI", () => {
    it("should register Transaction actions in the built-in actions map", () => {
      const actionsMap = getBuiltInResourceActions();
      const transactionActions = actionsMap.get(ResourceTypes.CICSLocalTransaction);

      expect(transactionActions).toBeDefined();
      expect(transactionActions).toHaveLength(5);
    });

    it("should include COPY_NAME action for Transaction in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const transactionActions = actionsMap.get(ResourceTypes.CICSLocalTransaction);
      const copyAction = transactionActions.find((a) => a.id === "CICS.CICSLocalTransaction.COPY_NAME");

      expect(copyAction).toBeDefined();
      expect(copyAction?.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COMPARE_TO action for Transaction in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const transactionActions = actionsMap.get(ResourceTypes.CICSLocalTransaction);
      const compareAction = transactionActions.find((a) => a.id === "CICS.CICSLocalTransaction.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });
  });

  describe("Local File Actions in RI", () => {
    it("should register Local File actions in the built-in actions map", () => {
      const actionsMap = getBuiltInResourceActions();
      const localFileActions = actionsMap.get(ResourceTypes.CICSLocalFile);

      expect(localFileActions).toBeDefined();
      expect(localFileActions).toHaveLength(6);
    });

    it("should include COPY_NAME action for Local File in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const localFileActions = actionsMap.get(ResourceTypes.CICSLocalFile);
      const copyAction = localFileActions.find((a) => a.id === "CICS.CICSLocalFile.COPY_NAME");

      expect(copyAction).toBeDefined();
      expect(copyAction?.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COMPARE_TO action for Local File in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const localFileActions = actionsMap.get(ResourceTypes.CICSLocalFile);
      const compareAction = localFileActions.find((a) => a.id === "CICS.CICSLocalFile.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });
  });

  describe("Bundle Actions in RI", () => {
    it("should register Bundle actions in the built-in actions map", () => {
      const actionsMap = getBuiltInResourceActions();
      const bundleActions = actionsMap.get(ResourceTypes.CICSBundle);

      expect(bundleActions).toBeDefined();
      expect(bundleActions).toHaveLength(4);
    });

    it("should include ENABLE action for Bundle in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const bundleActions = actionsMap.get(ResourceTypes.CICSBundle);
      const enableAction = bundleActions.find((a) => a.id === "CICS.CICSBundle.ENABLE");

      expect(enableAction).toBeDefined();
      expect(enableAction?.action).toBe("cics-extension-for-zowe.enableBundle");
    });

    it("should include DISABLE action for Bundle in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const bundleActions = actionsMap.get(ResourceTypes.CICSBundle);
      const disableAction = bundleActions.find((a) => a.id === "CICS.CICSBundle.DISABLE");

      expect(disableAction).toBeDefined();
      expect(disableAction?.action).toBe("cics-extension-for-zowe.disableBundle");
    });

    it("should include COMPARE_TO action for Bundle in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const bundleActions = actionsMap.get(ResourceTypes.CICSBundle);
      const compareAction = bundleActions.find((a) => a.id === "CICS.CICSBundle.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COPY_NAME action for Bundle in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const bundleActions = actionsMap.get(ResourceTypes.CICSBundle);
      const copyAction = bundleActions.find((a) => a.id === "CICS.CICSBundle.COPY_NAME");

      expect(copyAction).toBeDefined();
      expect(copyAction?.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction?.refreshResourceInspector).toBe(false);
    });
  });
});
