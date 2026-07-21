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
import { getTCPIPActions } from "../../../../src/resources/actions/TCPIPActions";

describe("TCP/IP Service Actions", () => {
  describe("getTCPIPActions", () => {
    it("should return exactly 2 TCP/IP service actions", () => {
      const actions = getTCPIPActions();
      expect(actions).toHaveLength(2);
    });

    it("should return ResourceAction instances with CICSTCPIPService resource type", () => {
      const actions = getTCPIPActions();
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
        expect(action.resourceType).toBe(ResourceTypes.CICSTCPIPService);
      });
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should have correct id and command", () => {
      const actions = getTCPIPActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSTCPIPService.COPY_NAME")!;

      expect(copyAction).toBeDefined();
      expect(copyAction.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction.refreshResourceInspector).toBe(false);
      expect(copyAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should have correct id and command", () => {
      const actions = getTCPIPActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSTCPIPService.COMPARE_TO")!;

      expect(compareAction).toBeDefined();
      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction.refreshResourceInspector).toBe(false);
      expect(compareAction.visibleWhen).toBeUndefined();
    });
  });
});
