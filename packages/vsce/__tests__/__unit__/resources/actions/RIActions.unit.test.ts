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
      expect(libraryActions).toHaveLength(3);
    });

    it("should include ENABLE action for Library in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary)!;
      const enableAction = libraryActions.find((a) => a.id === "CICS.CICSLibrary.ENABLE");

      expect(enableAction).toBeDefined();
      expect(enableAction?.action).toBe("cics-extension-for-zowe.enableLibrary");
    });

    it("should include DISABLE action for Library in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary)!;
      const disableAction = libraryActions.find((a) => a.id === "CICS.CICSLibrary.DISABLE");

      expect(disableAction).toBeDefined();
      expect(disableAction?.action).toBe("cics-extension-for-zowe.disableLibrary");
    });

    it("should include COMPARE_TO action for Library in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const libraryActions = actionsMap.get(ResourceTypes.CICSLibrary)!;
      const compareAction = libraryActions.find((a) => a.id === "CICS.CICSLibrary.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });
  });

  describe("Task Actions in RI", () => {
    it("should register Task actions in the built-in actions map", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask);

      expect(taskActions).toBeDefined();
      expect(taskActions).toHaveLength(3);
    });

    it("should include PURGE action for Task in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask)!;
      const purgeAction = taskActions.find((a) => a.id === "CICS.CICSTask.PURGE");

      expect(purgeAction).toBeDefined();
      expect(purgeAction?.action).toBe("cics-extension-for-zowe.purgeTask");
      expect(purgeAction?.refreshResourceInspector).toBe(false);
    });

    it("should include INQUIRE_TRANSACTION action for Task in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask)!;
      const inquireAction = taskActions.find((a) => a.id === "CICS.CICSTask.INQUIRE_TRANSACTION");

      expect(inquireAction).toBeDefined();
      expect(inquireAction?.action).toBe("cics-extension-for-zowe.inquireTransaction");
      expect(inquireAction?.refreshResourceInspector).toBe(false);
    });

    it("should include COMPARE_TO action for Task in RI", () => {
      const actionsMap = getBuiltInResourceActions();
      const taskActions = actionsMap.get(ResourceTypes.CICSTask)!;
      const compareAction = taskActions.find((a) => a.id === "CICS.CICSTask.COMPARE_TO");

      expect(compareAction).toBeDefined();
      expect(compareAction?.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction?.refreshResourceInspector).toBe(false);
    });
  });
});
