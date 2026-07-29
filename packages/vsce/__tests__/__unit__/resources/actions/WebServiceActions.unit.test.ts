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
import { getWebServiceActions } from "../../../../src/resources/actions/WebServiceActions";

describe("Web Service Actions", () => {
  describe("getWebServiceActions", () => {
    it("should return exactly 2 web service actions", () => {
      const actions = getWebServiceActions();
      expect(actions).toHaveLength(2);
    });

    it("should return ResourceAction instances with CICSWebService resource type", () => {
      const actions = getWebServiceActions();
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
        expect(action.resourceType).toBe(ResourceTypes.CICSWebService);
      });
    });

    it("should have unique action IDs", () => {
      const actions = getWebServiceActions();
      const ids = actions.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should return actions in expected order", () => {
      const actions = getWebServiceActions();
      expect(actions[0].id).toBe("CICS.CICSWebService.COPY_NAME");
      expect(actions[1].id).toBe("CICS.CICSWebService.COMPARE_TO");
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should have correct id and command", () => {
      const actions = getWebServiceActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSWebService.COPY_NAME")!;

      expect(copyAction).toBeDefined();
      expect(copyAction.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction.refreshResourceInspector).toBe(false);
      expect(copyAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should have correct id and command", () => {
      const actions = getWebServiceActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSWebService.COMPARE_TO")!;

      expect(compareAction).toBeDefined();
      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction.refreshResourceInspector).toBe(false);
      expect(compareAction.visibleWhen).toBeUndefined();
    });
  });
});
