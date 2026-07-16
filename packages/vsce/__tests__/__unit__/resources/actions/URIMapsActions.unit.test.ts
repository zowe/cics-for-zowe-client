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

import { ResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { getURIMapActions } from "../../../../src/resources/actions/URIMapsActions";

describe("URIMap Actions", () => {
  describe("getURIMapActions", () => {
    it("should return exactly 2 URIMap actions", () => {
      const actions = getURIMapActions();
      expect(actions).toHaveLength(2);
    });

    it("should return ResourceAction instances with CICSURIMap resource type", () => {
      const actions = getURIMapActions();
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
        expect(action.resourceType).toBe(ResourceTypes.CICSURIMap);
      });
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should have correct id and command", () => {
      const actions = getURIMapActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSURIMap.COPY_NAME")!;

      expect(copyAction).toBeDefined();
      expect(copyAction.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction.refreshResourceInspector).toBe(false);
      expect(copyAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should have correct id and command", () => {
      const actions = getURIMapActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSURIMap.COMPARE_TO")!;

      expect(compareAction).toBeDefined();
      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction.refreshResourceInspector).toBe(false);
      expect(compareAction.visibleWhen).toBeUndefined();
    });
  });
});
